import type { CoveragePathPlan } from "@/types/serviceTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlatPoint {
    x: number;
    y: number;
    /** Index into `CoveragePathPlan.segments`. */
    segmentIndex: number;
}

export interface FlattenedPath {
    /** Ordered flat points from all segments concatenated. */
    points: FlatPoint[];
    /**
     * Cumulative Euclidean distance up to each point.
     * `cumulativeDistances[0]` is always 0.
     * Length equals `points.length`.
     */
    cumulativeDistances: number[];
    /** Total path length in world units. */
    totalLength: number;
    /**
     * Set of flat-point indices where a new CoveragePathPlanSegment begins.
     * Use these as line-break positions when building Konva Line arrays.
     */
    segmentBoundaries: Set<number>;
    /** First point of the entire path (for start marker). */
    firstPoint: { x: number; y: number } | null;
    /** Last point of the entire path (for end marker). */
    lastPoint: { x: number; y: number } | null;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function dist(ax: number, ay: number, bx: number, by: number): number {
    const dx = bx - ax;
    const dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Flattens all segments of a `CoveragePathPlan` into a single ordered point
 * array with cumulative distances and segment boundary markers.
 *
 * Segments with fewer than 2 points are skipped (no line can be drawn).
 * The returned object is a pure data snapshot — safe to store in a ref.
 */
export function flattenCoveragePathPlan(plan: CoveragePathPlan): FlattenedPath {
    const points: FlatPoint[] = [];
    const cumulativeDistances: number[] = [];
    const segmentBoundaries = new Set<number>();

    let totalLength = 0;

    for (let si = 0; si < plan.segments.length; si++) {
        const segment = plan.segments[si]!;
        if (segment.path.length < 2) continue;

        // Every segment starts its own Konva Line so that genuinely overlapping
        // passes from different segments stack their semi-transparent strokes and
        // accumulate opacity. The double-cap artefact at shared waypoints is
        // handled in the renderer by using lineCap="butt" on committed lines and
        // lineCap="round" only on the in-progress active line.
        const boundaryIndex = points.length;
        segmentBoundaries.add(boundaryIndex);

        for (let pi = 0; pi < segment.path.length; pi++) {
            const ip = segment.path[pi]!;
            const x = ip.point.x;
            const y = ip.point.y;

            if (points.length === 0) {
                // Very first point — cumulative distance is 0
                cumulativeDistances.push(0);
            } else {
                const prev = points[points.length - 1]!;
                const d = dist(prev.x, prev.y, x, y);
                totalLength += d;
                cumulativeDistances.push(totalLength);
            }

            points.push({ x, y, segmentIndex: si });
        }
    }

    const firstPoint =
        points.length > 0 ? { x: points[0]!.x, y: points[0]!.y } : null;
    const lastPoint =
        points.length > 0
            ? { x: points[points.length - 1]!.x, y: points[points.length - 1]!.y }
            : null;

    return { points, cumulativeDistances, totalLength, segmentBoundaries, firstPoint, lastPoint };
}

// ─── Path slice at a given distance ──────────────────────────────────────────

export interface PathSlice {
    /** Completed segment lines ready to feed into Konva as `{ points: number[] }[]`. */
    committedLines: { points: number[] }[];
    /** The currently-animating line's flat [x, y, x, y, …] points. */
    activeLinePoints: number[];
    /** The interpolated tip point at exactly `targetDistance`. */
    tipPoint: { x: number; y: number } | null;
}

/**
 * Given a `FlattenedPath` and a target distance, returns the drawn portion of
 * the path split into committed lines (at segment boundaries) and the active
 * in-progress line.
 *
 * Uses binary search for O(log n) lookup.
 */
export function slicePathAtDistance(
    flat: FlattenedPath,
    targetDistance: number,
): PathSlice {
    const { points, cumulativeDistances, segmentBoundaries } = flat;

    if (points.length === 0) {
        return { committedLines: [], activeLinePoints: [], tipPoint: null };
    }

    // Clamp to path bounds
    const clampedDist = Math.min(targetDistance, flat.totalLength);

    // Binary search: find the last index i such that cumulativeDistances[i] <= clampedDist
    let lo = 0;
    let hi = cumulativeDistances.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (cumulativeDistances[mid]! <= clampedDist) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    const lastFullIndex = lo;

    // Interpolate between lastFullIndex and lastFullIndex+1 if we haven't
    // reached the very end of the path
    let tipX: number;
    let tipY: number;

    const nextIndex = lastFullIndex + 1;
    if (
        nextIndex < points.length &&
        cumulativeDistances[nextIndex]! > cumulativeDistances[lastFullIndex]!
    ) {
        const segLen =
            cumulativeDistances[nextIndex]! - cumulativeDistances[lastFullIndex]!;
        const t =
            (clampedDist - cumulativeDistances[lastFullIndex]!) / segLen;
        const a = points[lastFullIndex]!;
        const b = points[nextIndex]!;
        tipX = a.x + t * (b.x - a.x);
        tipY = a.y + t * (b.y - a.y);
    } else {
        tipX = points[lastFullIndex]!.x;
        tipY = points[lastFullIndex]!.y;
    }

    // Build committed lines and the active line by walking 0 → lastFullIndex
    const committedLines: { points: number[] }[] = [];
    let currentLine: number[] = [];

    for (let i = 0; i <= lastFullIndex; i++) {
        if (i > 0 && segmentBoundaries.has(i)) {
            // Finish the previous line and start a new one
            if (currentLine.length >= 4) {
                committedLines.push({ points: currentLine });
            }
            currentLine = [];
        }
        const p = points[i]!;
        currentLine.push(p.x, p.y);
    }

    // The current (last) line is the active line; push tip interpolated point
    currentLine.push(tipX, tipY);

    // If the active line has fewer than 2 points it can't be drawn as a Line
    const activeLinePoints = currentLine.length >= 4 ? currentLine : [];

    return {
        committedLines,
        activeLinePoints,
        tipPoint: { x: tipX, y: tipY },
    };
}
