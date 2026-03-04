import type { Object, Vertex } from "@/types/schemaTypes";
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
    objects: Object[],
    vertices: Vertex[],
    objectId: number,
): { objects: Object[]; vertices: Vertex[] } {
    const objVerts = objectVertices(vertices, objectId);
    const n = objVerts.length;

    // Rebuild linked list
    const linked = new Map<number, Vertex>(
        objVerts.map((v, i) => [v.id, { ...v, nextVertexId: i < n - 1 ? objVerts[i + 1]!.id : null }]),
    );
    const newVertices = vertices.map((v) => (v.objectId === objectId ? (linked.get(v.id) ?? v) : v));

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
// Vertex-specific dirty tracking (deletedVertexIds is Map<vertexKey, {id,objectId,environmentId}>)
// ---------------------------------------------------------------------------

/** Composite key matching the DB compound primary key [objectId+environmentId+id]. */
export function vertexKey(objectId: number, environmentId: number, id: number): string {
    return `${objectId}:${environmentId}:${id}`;
}

export function markVertexDirty(
    dirty: Set<string>,
    deleted: Map<string, { id: number; objectId: number; environmentId: number }>,
    id: number,
    objectId: number,
    environmentId: number,
): { dirty: Set<string>; deleted: Map<string, { id: number; objectId: number; environmentId: number }> } {
    const key = vertexKey(objectId, environmentId, id);
    const newDeleted = new Map(deleted);
    newDeleted.delete(key);
    return { dirty: new Set([...dirty, key]), deleted: newDeleted };
}

export function markVertexDeleted(
    dirty: Set<string>,
    deleted: Map<string, { id: number; objectId: number; environmentId: number }>,
    id: number,
    objectId: number,
    environmentId: number,
): { dirty: Set<string>; deleted: Map<string, { id: number; objectId: number; environmentId: number }> } {
    const key = vertexKey(objectId, environmentId, id);
    const newDirty = new Set(dirty);
    newDirty.delete(key);
    const newDeleted = new Map(deleted);
    newDeleted.set(key, { id, objectId, environmentId });
    return { dirty: newDirty, deleted: newDeleted };
}
