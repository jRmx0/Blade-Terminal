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
