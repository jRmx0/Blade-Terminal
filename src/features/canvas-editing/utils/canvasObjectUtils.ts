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
function rebuildLinkedList(vertices: Vertex[], objectId: number): Vertex[] {
    const objVerts = objectVertices(vertices, objectId);
    const n = objVerts.length;
    const linked = new Map<number, Vertex>();
    for (let i = 0; i < n; i++) {
        const v = objVerts[i]!;
        linked.set(v.id, { ...v, nextVertexId: i < n - 1 ? objVerts[i + 1]!.id : null });
    }
    return vertices.map((v) => (v.objectId === objectId ? (linked.get(v.id) ?? v) : v));
}

function updateObjectStats(objects: Object[], vertices: Vertex[], objectId: number): Object[] {
    const objVerts = objectVertices(vertices, objectId);
    const n = objVerts.length;
    const area = n >= 3 ? shoelaceArea(objVerts) : 0;
    return objects.map((o) => (o.id === objectId ? { ...o, vertexCount: n, area } : o));
}

export function syncObject(
    objects: Object[],
    vertices: Vertex[],
    objectId: number,
): { objects: Object[]; vertices: Vertex[] } {
    return {
        vertices: rebuildLinkedList(vertices, objectId),
        objects: updateObjectStats(objects, vertices, objectId),
    };
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/** True when two objects share the same compound primary key [id, environmentId]. */
export function sameObject(a: Object, b: Object): boolean {
    return a.id === b.id && a.environmentId === b.environmentId;
}

/** True when two vertices share the same compound primary key [objectId, environmentId, id]. */
export function sameVertex(a: Vertex, b: Vertex): boolean {
    return a.id === b.id && a.objectId === b.objectId && a.environmentId === b.environmentId;
}

// ---------------------------------------------------------------------------
// Dirty tracking (dirty and deleted are mutually exclusive per id)
// ---------------------------------------------------------------------------

export function markDirty(
    dirty: Object[],
    deleted: Object[],
    obj: Object,
): { dirty: Object[]; deleted: Object[] } {
    return {
        dirty: [...dirty.filter((o) => o.id !== obj.id), obj],
        deleted: deleted.filter((o) => o.id !== obj.id),
    };
}

export function markDeleted(
    dirty: Object[],
    deleted: Object[],
    obj: Object,
): { dirty: Object[]; deleted: Object[] } {
    return {
        dirty: dirty.filter((o) => o.id !== obj.id),
        deleted: [...deleted.filter((o) => o.id !== obj.id), obj],
    };
}

// ---------------------------------------------------------------------------
// Vertex-specific dirty tracking
// ---------------------------------------------------------------------------

/** Composite key matching the DB compound primary key [objectId+environmentId+id]. */
export function vertexKey(objectId: number, environmentId: number, id: number): string {
    return `${objectId}:${environmentId}:${id}`;
}

export function markVertexDirty(
    dirty: Vertex[],
    deleted: Vertex[],
    vertex: Vertex,
): { dirty: Vertex[]; deleted: Vertex[] } {
    const key = vertexKey(vertex.objectId, vertex.environmentId, vertex.id);
    const keep = (v: Vertex) => vertexKey(v.objectId, v.environmentId, v.id) !== key;
    return {
        dirty: [...dirty.filter(keep), vertex],
        deleted: deleted.filter(keep),
    };
}

export function markVertexDeleted(
    dirty: Vertex[],
    deleted: Vertex[],
    vertex: Vertex,
): { dirty: Vertex[]; deleted: Vertex[] } {
    const key = vertexKey(vertex.objectId, vertex.environmentId, vertex.id);
    const keep = (v: Vertex) => vertexKey(v.objectId, v.environmentId, v.id) !== key;
    return {
        dirty: dirty.filter(keep),
        deleted: [...deleted.filter(keep), vertex],
    };
}
