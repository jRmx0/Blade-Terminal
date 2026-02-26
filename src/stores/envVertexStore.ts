import { create } from "zustand";
import type { EnvVertex } from "@/types/envTypes";
import { useEnvObjectStore } from "@/stores/envObjectStore";
import { computePolygonArea } from "@/utils/geometry";

let _idCounter = 0;
function nextId() {
    return `vtx-${++_idCounter}`;
}

/**
 * Traverses the linked list and returns vertices for the given object in order.
 * Head is the vertex not referenced by any other vertex's nextVertexId.
 */
function orderVertices(objectVertices: EnvVertex[]): EnvVertex[] {
    if (objectVertices.length === 0) return [];

    const pointedTo = new Set(
        objectVertices.map((v) => v.nextVertexId).filter((id): id is string => id !== null)
    );
    const head = objectVertices.find((v) => !pointedTo.has(v.id)) ?? objectVertices[0]!;

    const result: EnvVertex[] = [];
    const visited = new Set<string>();
    let current: EnvVertex | undefined = head;

    while (current && !visited.has(current.id)) {
        result.push(current);
        visited.add(current.id);
        current = current.nextVertexId
            ? objectVertices.find((v) => v.id === current!.nextVertexId)
            : undefined;
    }

    return result;
}

/** Recomputes vertexCount and area for an object after a vertex mutation. */
function syncObjectCache(objectId: string, allVertices: EnvVertex[]) {
    const ordered = orderVertices(allVertices.filter((v) => v.objectId === objectId));
    useEnvObjectStore.getState().updateCachedFields(objectId, ordered.length, computePolygonArea(ordered));
}

interface EnvVertexState {
    vertices: EnvVertex[];

    /** Returns vertices for an object in linked-list order. */
    getOrderedVertices: (objectId: string) => EnvVertex[];

    /** Appends a vertex to the end of the object's linked list. Returns the new vertex id. */
    addVertex: (objectId: string, x: number, y: number) => string;

    /** Inserts a vertex immediately after afterVertexId. Returns the new vertex id. */
    insertVertex: (objectId: string, afterVertexId: string, x: number, y: number) => string;

    /** Removes a vertex and repairs the linked list. */
    deleteVertex: (id: string) => void;

    /** Updates the position of a vertex. */
    updateVertex: (id: string, x: number, y: number) => void;

    /** Removes all vertices belonging to a given object. */
    deleteObjectVertices: (objectId: string) => void;
}

export const useEnvVertexStore = create<EnvVertexState>((set, get) => ({
    vertices: [],

    getOrderedVertices: (objectId) => {
        const objectVerts = get().vertices.filter((v) => v.objectId === objectId);
        return orderVertices(objectVerts);
    },

    addVertex: (objectId, x, y) => {
        const id = nextId();
        set((state) => {
            const objectVerts = state.vertices.filter((v) => v.objectId === objectId);
            const tail = objectVerts.find((v) => v.nextVertexId === null);

            const updated = tail
                ? state.vertices.map((v) => v.id === tail.id ? { ...v, nextVertexId: id } : v)
                : state.vertices;

            const newVertex: EnvVertex = { id, objectId, nextVertexId: null, x, y };
            return { vertices: [...updated, newVertex] };
        });
        syncObjectCache(objectId, get().vertices);
        return id;
    },

    insertVertex: (objectId, afterVertexId, x, y) => {
        const id = nextId();
        set((state) => {
            const after = state.vertices.find((v) => v.id === afterVertexId);
            const newVertex: EnvVertex = {
                id,
                objectId,
                nextVertexId: after?.nextVertexId ?? null,
                x,
                y,
            };
            const updated = state.vertices.map((v) =>
                v.id === afterVertexId ? { ...v, nextVertexId: id } : v
            );
            return { vertices: [...updated, newVertex] };
        });
        syncObjectCache(objectId, get().vertices);
        return id;
    },

    deleteVertex: (id) => {
        const target = get().vertices.find((v) => v.id === id);
        if (!target) return;
        set((state) => {
            const updated = state.vertices
                .filter((v) => v.id !== id)
                .map((v) =>
                    v.nextVertexId === id ? { ...v, nextVertexId: target.nextVertexId } : v
                );
            return { vertices: updated };
        });
        syncObjectCache(target.objectId, get().vertices);
    },

    updateVertex: (id, x, y) => {
        const target = get().vertices.find((v) => v.id === id);
        if (!target) return;
        set((state) => ({
            vertices: state.vertices.map((v) => v.id === id ? { ...v, x, y } : v),
        }));
        syncObjectCache(target.objectId, get().vertices);
    },

    deleteObjectVertices: (objectId) => {
        set((state) => ({
            vertices: state.vertices.filter((v) => v.objectId !== objectId),
        }));
    },
}));
