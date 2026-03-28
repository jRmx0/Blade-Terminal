import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";

/**
 * Computes the signed area of a closed polygon using the Shoelace (Gauss) formula.
 * In screen coordinates (Y increases downward):
 *   - Positive → clockwise winding (zone convention)
 *   - Negative → counter-clockwise winding (obstacle convention)
 * Returns 0 for fewer than 3 points.
 */
export function computeSignedPolygonArea(vertices: Point[]): number {
    const n = vertices.length;
    if (n < 3) return 0;
    let area = 0;
    for (let i = 0; i < n; i++) {
        const curr = vertices[i]!;
        const next = vertices[(i + 1) % n]!;
        area += curr.x * next.y;
        area -= next.x * curr.y;
    }
    return area / 2;
}

/**
 * Computes the area of a closed polygon using the Shoelace (Gauss) formula.
 * Vertices may be in either CW or CCW order; the result is always positive.
 * Returns 0 for fewer than 3 points.
 */
export function computePolygonArea(vertices: Point[]): number {
    return Math.abs(computeSignedPolygonArea(vertices));
}

/**
 * Returns vertices in the required winding order for the given category.
 * In screen coordinates (Y↓): zones must be CW (signed area > 0),
 * obstacles must be CCW (signed area < 0).
 * Returns the same array reference when winding is already correct.
 * Unknown categories are returned unchanged.
 */
export function ensureWinding(
    vertices: Array<{ x: number; y: number }>,
    category: string,
): Array<{ x: number; y: number }> {
    if (vertices.length < 3) return vertices;
    const signed = computeSignedPolygonArea(vertices);
    if (category === "zone") return signed > 0 ? vertices : [...vertices].reverse();
    if (category === "obstacle") return signed < 0 ? vertices : [...vertices].reverse();
    return vertices;
}
