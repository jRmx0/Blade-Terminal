import type { EnvVertex } from "@/types/envTypes";

export interface EdgeMidpoint {
    /** Index of the edge's start vertex (edge goes from vertices[afterIndex] to vertices[afterIndex+1]) */
    afterIndex: number;
    x: number;
    y: number;
}

/** Returns vertices belonging to an object, in polygon draw order. */
export function objectVertices(vertices: EnvVertex[], objectId: number): EnvVertex[] {
    return vertices.filter((v) => v.objectId === objectId);
}

/** Shoelace formula — always positive. */
export function shoelaceArea(verts: { x: number; y: number }[]): number {
    let sum = 0;
    const n = verts.length;
    for (let i = 0; i < n; i++) {
        const a = verts[i]!;
        const b = verts[(i + 1) % n]!;
        sum += a.x * b.y - b.x * a.y;
    }
    return Math.abs(sum / 2);
}

/**
 * Computes the midpoint of every edge in a closed polygon.
 * The last edge wraps from the final vertex back to vertices[0].
 */
export function computeEdgeMidpoints(vertices: EnvVertex[]): EdgeMidpoint[] {
    return vertices.map((v, i) => {
        const next = vertices[(i + 1) % vertices.length]!;
        return {
            afterIndex: i,
            x: (v.x + next.x) / 2,
            y: (v.y + next.y) / 2,
        };
    });
}
