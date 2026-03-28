import type { Object } from "@/types/schemaTypes";
import type { ObjectCategory } from "@/config/db-ops/enums";

export interface Point {
    x: number;
    y: number;
}

export interface EdgeMidpoint extends Point {
    /** Index of the edge's start vertex (edge goes from vertices[afterIndex] to vertices[afterIndex+1]) */
    afterIndex: number;
}

/** Shoelace formula — always positive. */
export function shoelaceArea(verts: Point[]): number {
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
export function computeEdgeMidpoints(vertices: Array<{ x: number; y: number }>): EdgeMidpoint[] {
    return vertices.map((v, i) => {
        const next = vertices[(i + 1) % vertices.length]!;
        return {
            afterIndex: i,
            x: (v.x + next.x) / 2,
            y: (v.y + next.y) / 2,
        };
    });
}

// ---------------------------------------------------------------------------
// Sutherland-Hodgman polygon clipping
// ---------------------------------------------------------------------------

/** Returns the intersection point of segment (a→b) with the infinite line (c→d). */
function lineIntersect(a: Point, b: Point, c: Point, d: Point): Point {
    const A1 = b.y - a.y, B1 = a.x - b.x, C1 = A1 * a.x + B1 * a.y;
    const A2 = d.y - c.y, B2 = c.x - d.x, C2 = A2 * c.x + B2 * c.y;
    const det = A1 * B2 - A2 * B1;
    // det ≈ 0 means parallel — return midpoint as a safe fallback
    if (Math.abs(det) < 1e-10) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    return { x: (C1 * B2 - C2 * B1) / det, y: (A1 * C2 - A2 * C1) / det };
}

/** Returns true when point p is on the inside (left) of edge a→b. */
function inside(p: Point, a: Point, b: Point): boolean {
    return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= 0;
}

/**
 * Sutherland-Hodgman algorithm.
 * Clips `subject` polygon against the `clip` polygon (which must be convex or at
 * least simply-connected and wound counter-clockwise when using the standard rule).
 * Returns the intersection polygon vertices, or an empty array if no overlap.
 */
export function clipPolygon(subject: Point[], clip: Point[]): Point[] {
    let output = [...subject];
    if (output.length === 0) return [];

    for (let i = 0; i < clip.length; i++) {
        if (output.length === 0) return [];
        const a = clip[i]!;
        const b = clip[(i + 1) % clip.length]!;
        const input = output;
        output = [];

        for (let j = 0; j < input.length; j++) {
            const curr = input[j]!;
            const prev = input[(j + input.length - 1) % input.length]!;
            const currInside = inside(curr, a, b);
            const prevInside = inside(prev, a, b);

            if (currInside) {
                if (!prevInside) output.push(lineIntersect(prev, curr, a, b));
                output.push(curr);
            } else if (prevInside) {
                output.push(lineIntersect(prev, curr, a, b));
            }
        }
    }

    return output;
}

// ---------------------------------------------------------------------------
// Net area helper
// ---------------------------------------------------------------------------

/**
 * Computes the net area of a zone object: gross area minus the total area of all
 * obstacle polygons that overlap with it (clipped to the zone boundary).
 *
 * For obstacle objects the concept of "net area" doesn't apply — returns `null`.
 */
export function computeNetArea(
    obj: Object,
    objects: Object[],
): number | null {
    if ((obj.category as ObjectCategory) !== "zone") return null;

    const zonePoints: Point[] = obj.vertices;

    let overlapArea = 0;
    for (const o of objects) {
        if ((o.category as ObjectCategory) !== "obstacle") continue;
        const obstPoints: Point[] = o.vertices;
        const clipped = clipPolygon(obstPoints, zonePoints);
        if (clipped.length >= 3) {
            overlapArea += shoelaceArea(clipped);
        }
    }

    return Math.max(0, obj.area - overlapArea);
}
