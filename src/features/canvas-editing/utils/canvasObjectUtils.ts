import type { EnvObject, EnvVertex } from "@/types/envTypes";
import { objectVertices, shoelaceArea } from "./canvasGeometry";

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

/**
 * After any mutation to an object's vertices, call this to:
 *   1. Rebuild the nextVertexId linked-list for the object's vertices.
 *   2. Update vertexCount + area on the EnvObject.
 */
export function syncObject(
    objects: EnvObject[],
    vertices: EnvVertex[],
    objectId: number,
): { objects: EnvObject[]; vertices: EnvVertex[] } {
    const objVerts = objectVertices(vertices, objectId);
    const n = objVerts.length;

    // Rebuild linked list
    const linked = new Map<number, EnvVertex>(
        objVerts.map((v, i) => [v.id, { ...v, nextVertexId: i < n - 1 ? objVerts[i + 1]!.id : null }]),
    );
    const newVertices = vertices.map((v) => linked.get(v.id) ?? v);

    // Update object stats
    const area = n >= 3 ? shoelaceArea(objVerts) : 0;
    const newObjects = objects.map((o) =>
        o.id === objectId ? { ...o, vertexCount: n, area } : o,
    );

    return { objects: newObjects, vertices: newVertices };
}

// ---------------------------------------------------------------------------
// Dirty tracking (dirty and deleted are mutually exclusive per id)
// ---------------------------------------------------------------------------

export function markDirty(
    dirty: Set<number>,
    deleted: Set<number>,
    id: number,
): { dirty: Set<number>; deleted: Set<number> } {
    const newDeleted = new Set(deleted);
    newDeleted.delete(id);
    return { dirty: new Set([...dirty, id]), deleted: newDeleted };
}

export function markDeleted(
    dirty: Set<number>,
    deleted: Set<number>,
    id: number,
): { dirty: Set<number>; deleted: Set<number> } {
    const newDirty = new Set(dirty);
    newDirty.delete(id);
    return { dirty: newDirty, deleted: new Set([...deleted, id]) };
}

// ---------------------------------------------------------------------------
// Vertex-specific dirty tracking (deletedVertexIds is Map<vertexId, objectId>)
// ---------------------------------------------------------------------------

export function markVertexDirty(
    dirty: Set<number>,
    deleted: Map<number, number>,
    id: number,
): { dirty: Set<number>; deleted: Map<number, number> } {
    const newDeleted = new Map(deleted);
    newDeleted.delete(id);
    return { dirty: new Set([...dirty, id]), deleted: newDeleted };
}

export function markVertexDeleted(
    dirty: Set<number>,
    deleted: Map<number, number>,
    id: number,
    objectId: number,
): { dirty: Set<number>; deleted: Map<number, number> } {
    const newDirty = new Set(dirty);
    newDirty.delete(id);
    const newDeleted = new Map(deleted);
    newDeleted.set(id, objectId);
    return { dirty: newDirty, deleted: newDeleted };
}
