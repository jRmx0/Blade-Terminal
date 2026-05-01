import type { ComputeResultRecord, ComputationAlgorithmParameter } from "@/types/schemaTypes";
import type { AlgorithmParameter, CoveragePathPlanSegment } from "@/types/serviceTypes";

export interface ResolvePathWidthInput {
    result: ComputeResultRecord | null;
    catalogParams: AlgorithmParameter[];
    parameterValues: ComputationAlgorithmParameter[];
    fallback: number;
}

export interface BuildCoverageVisitMapInput {
    segments: CoveragePathPlanSegment[];
    cellSize: number;
    pathWidth: number;
}

export interface CoverageVisitMapResult {
    visitMap: Map<string, number>;
    maxCount: number;
}

/** Squared distance from point (px, py) to segment (ax, ay)->(bx, by). */
export function distSqPointToSegment(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
): number {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
        const ex = px - ax;
        const ey = py - ay;
        return ex * ex + ey * ey;
    }
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    const cx = ax + t * dx - px;
    const cy = ay + t * dy - py;
    return cx * cx + cy * cy;
}

/** Strip trailing alpha from an 8-char hex color (e.g. #0ea5e922 -> #0ea5e9). */
export function stripHexAlpha(hex: string): string {
    if (hex.length === 9 && hex[0] === "#") {
        return hex.slice(0, 7);
    }
    return hex;
}

/** Resolves numeric Path Width from catalog metadata + per-environment parameter values. */
export function resolvePathWidth(input: ResolvePathWidthInput): number {
    const { result, catalogParams, parameterValues, fallback } = input;
    if (!result) return fallback;

    const { algorithmId, providerId, environmentId } = result;

    const param = catalogParams.find(
        (p) => p.name === "Path Width" && p.algorithmId === algorithmId && p.computationProviderId === providerId,
    );
    if (!param) return fallback;

    const persisted = parameterValues.find(
        (v) =>
            v.id === param.id &&
            v.algorithmId === algorithmId &&
            v.providerId === providerId &&
            v.environmentId === environmentId,
    );

    const parsed = parseFloat(persisted?.value ?? param.defaultValue);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Iterative max scan (stack-safe for large maps). */
export function computeMaxVisitCount(visitMap: Map<string, number>): number {
    let max = 0;
    for (const count of visitMap.values()) {
        if (count > max) max = count;
    }
    return max;
}

/** Builds visit counts per coverage cell using path-width banding around each segment. */
export function buildCoverageVisitMap(input: BuildCoverageVisitMapInput): CoverageVisitMapResult {
    const { segments, cellSize, pathWidth } = input;
    const visitMap = new Map<string, number>();

    const cellWorld = Number.isFinite(cellSize) && cellSize > 0 ? cellSize : 1;
    const width = Number.isFinite(pathWidth) && pathWidth > 0 ? pathWidth : cellWorld;

    const halfWidth = width / 2;
    const halfSq = halfWidth * halfWidth;

    for (const segment of segments) {
        const path = segment.path;
        for (let i = 0; i + 1 < path.length; i++) {
            const p0 = path[i]!.point;
            const p1 = path[i + 1]!.point;

            const minCol = Math.floor((Math.min(p0.x, p1.x) - halfWidth) / cellWorld);
            const maxCol = Math.floor((Math.max(p0.x, p1.x) + halfWidth) / cellWorld);
            const minRow = Math.floor((Math.min(p0.y, p1.y) - halfWidth) / cellWorld);
            const maxRow = Math.floor((Math.max(p0.y, p1.y) + halfWidth) / cellWorld);

            for (let col = minCol; col <= maxCol; col++) {
                for (let row = minRow; row <= maxRow; row++) {
                    const cx = (col + 0.5) * cellWorld;
                    const cy = (row + 0.5) * cellWorld;
                    if (distSqPointToSegment(cx, cy, p0.x, p0.y, p1.x, p1.y) <= halfSq) {
                        const key = `${col},${row}`;
                        visitMap.set(key, (visitMap.get(key) ?? 0) + 1);
                    }
                }
            }
        }
    }

    return {
        visitMap,
        maxCount: computeMaxVisitCount(visitMap),
    };
}
