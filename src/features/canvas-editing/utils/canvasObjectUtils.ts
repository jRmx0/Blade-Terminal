import type { Object } from "@/types/schemaTypes";
import type { VertexRef } from "@/features/canvas-editing/types/canvas";
import { shoelaceArea } from "./canvasGeometry";

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

/**
 * After any mutation to an object's vertices, call this to recompute
 * vertexCount + area on the EnvObject.
 */
export function syncObject(objects: Object[], objectId: number): Object[] {
    return objects.map((o) => {
        if (o.id !== objectId) return o;
        const n = o.vertices.length;
        return { ...o, vertexCount: n, area: n >= 3 ? shoelaceArea(o.vertices) : 0 };
    });
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/** True when two objects share the same compound primary key [id, environmentId]. */
export function sameObject(a: Object, b: Object): boolean {
    return a.id === b.id && a.environmentId === b.environmentId;
}

/** True when two VertexRefs refer to the same vertex position. */
export function sameVertexRef(a: VertexRef, b: VertexRef): boolean {
    return a.objectId === b.objectId && a.index === b.index;
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
