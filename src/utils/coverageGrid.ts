import type { ComputeResultRecord, ComputationAlgorithmParameter, Object as CanvasObject } from "@/types/schemaTypes";
import type { AlgorithmParameter, CoveragePathPlanSegment } from "@/types/serviceTypes";
import { OBJECT_CATEGORY } from "@/config/db-ops/enums";

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

export interface ComputeCoverageRatioInput {
    visitMap: Map<string, number>;
    cellSize: number;
    objects: CanvasObject[];
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

function pointInPolygon(x: number, y: number, vertices: Array<{ x: number; y: number }>): boolean {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const vi = vertices[i]!;
        const vj = vertices[j]!;
        const intersects =
            (vi.y > y) !== (vj.y > y) &&
            x < ((vj.x - vi.x) * (y - vi.y)) / (vj.y - vi.y + Number.EPSILON) + vi.x;
        if (intersects) inside = !inside;
    }
    return inside;
}

export function computeCoverageRatio(input: ComputeCoverageRatioInput): number | null {
    const { visitMap, cellSize, objects } = input;
    const cellWorld = Number.isFinite(cellSize) && cellSize > 0 ? cellSize : 1;

    const zones = objects.filter((o) => o.category === OBJECT_CATEGORY.ZONE && o.vertices.length >= 3);
    if (zones.length === 0) return null;
    const obstacles = objects.filter((o) => o.category === OBJECT_CATEGORY.OBSTACLE && o.vertices.length >= 3);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const z of zones) {
        for (const v of z.vertices) {
            if (v.x < minX) minX = v.x;
            if (v.x > maxX) maxX = v.x;
            if (v.y < minY) minY = v.y;
            if (v.y > maxY) maxY = v.y;
        }
    }

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
        return null;
    }

    const minCol = Math.floor(minX / cellWorld);
    const maxCol = Math.floor(maxX / cellWorld);
    const minRow = Math.floor(minY / cellWorld);
    const maxRow = Math.floor(maxY / cellWorld);

    let totalWorkCells = 0;
    let coveredWorkCells = 0;

    for (let col = minCol; col <= maxCol; col++) {
        for (let row = minRow; row <= maxRow; row++) {
            const cx = (col + 0.5) * cellWorld;
            const cy = (row + 0.5) * cellWorld;

            const inZone = zones.some((z) => pointInPolygon(cx, cy, z.vertices));
            if (!inZone) continue;
            const inObstacle = obstacles.some((o) => pointInPolygon(cx, cy, o.vertices));
            if (inObstacle) continue;

            totalWorkCells += 1;
            if ((visitMap.get(`${col},${row}`) ?? 0) > 0) {
                coveredWorkCells += 1;
            }
        }
    }

    if (totalWorkCells === 0) return null;
    return coveredWorkCells / totalWorkCells;
}
