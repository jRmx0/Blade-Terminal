import type { CanvasVertex } from "@/features/canvas-editing/types/canvas";

export interface EdgeMidpoint {
    /** Index of the edge's start vertex (edge goes from vertices[afterIndex] to vertices[afterIndex+1]) */
    afterIndex: number;
    x: number;
    y: number;
}

/**
 * Computes the midpoint of every edge in a closed polygon.
 * The last edge wraps from the final vertex back to vertices[0].
 */
export function computeEdgeMidpoints(vertices: CanvasVertex[]): EdgeMidpoint[] {
    return vertices.map((v, i) => {
        const next = vertices[(i + 1) % vertices.length]!;
        return {
            afterIndex: i,
            x: (v.x + next.x) / 2,
            y: (v.y + next.y) / 2,
        };
    });
}
