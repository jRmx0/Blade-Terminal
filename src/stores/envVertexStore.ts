import { create } from "zustand";
import type { EnvVertex } from "@/types/envTypes";
import { useEnvObjectStore } from "@/stores/envObjectStore";
import { computePolygonArea } from "@/utils/geometry";
import { getSaveMode } from "@/stores/saveModeStore";
import {
    saveEnvVertex,
    saveEnvVertices,
    deleteEnvVertex as dbDeleteEnvVertex,
    getEnvVerticesByObject,
} from "@server/db/env-vertices";

let _idCounter = 0;
function nextId(): number {
    return ++_idCounter;
}

/**
 * Traverses the linked list and returns vertices for the given object in order.
 * Head is the vertex not referenced by any other vertex's nextVertexId.
 */
function orderVertices(objectVertices: EnvVertex[]): EnvVertex[] {
    if (objectVertices.length === 0) return [];

    const pointedTo = new Set(
        objectVertices.map((v) => v.nextVertexId).filter((id): id is number => id !== null)
    );
    const head = objectVertices.find((v) => !pointedTo.has(v.id)) ?? objectVertices[0]!;

    const result: EnvVertex[] = [];
    const visited = new Set<number>();
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
function syncObjectCache(objectId: number, allVertices: EnvVertex[]) {
    const ordered = orderVertices(allVertices.filter((v) => v.objectId === objectId));
    useEnvObjectStore.getState().updateCachedFields(objectId, ordered.length, computePolygonArea(ordered));
}

interface EnvVertexState {
    vertices: EnvVertex[];

    /** Returns vertices for an object in linked-list order. */
    getOrderedVertices: (objectId: number) => EnvVertex[];

    /** Appends a vertex to the end of the object's linked list. Returns the new vertex id. */
    addVertex: (objectId: number, x: number, y: number) => number;

    /** Inserts a vertex immediately after afterVertexId. Returns the new vertex id. */
    insertVertex: (objectId: number, afterVertexId: number, x: number, y: number) => number;

    /** Removes a vertex and repairs the linked list. */
    deleteVertex: (id: number) => void;

    /** Updates the position of a vertex. */
    updateVertex: (id: number, x: number, y: number) => void;

    /** Removes all vertices belonging to a given object. */
    deleteObjectVertices: (objectId: number) => void;

    /** Manual save: persists all current vertices to IndexedDB. */
    save: () => Promise<void>;

    /** Loads all vertices for the given object IDs from IndexedDB. Merges with existing in-memory vertices. */
    loadByObjectIds: (objectIds: number[]) => Promise<void>;
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
        if (getSaveMode() === "autosave") {
            const newVertex = get().vertices.find((v) => v.id === id)!;
            const updatedTail = get().vertices.find((v) => v.nextVertexId === id);
            const toSave = updatedTail ? [updatedTail, newVertex] : [newVertex];
            saveEnvVertices(toSave).catch(console.error);
        }
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
        if (getSaveMode() === "autosave") {
            const affected = get().vertices.filter((v) => v.id === id || v.id === afterVertexId);
            saveEnvVertices(affected).catch(console.error);
        }
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
        if (getSaveMode() === "autosave") {
            dbDeleteEnvVertex(id, target.objectId).catch(console.error);
            const prev = get().vertices.find((v) => v.nextVertexId === target.nextVertexId);
            if (prev) saveEnvVertex(prev).catch(console.error);
        }
    },

    updateVertex: (id, x, y) => {
        const target = get().vertices.find((v) => v.id === id);
        if (!target) return;
        set((state) => ({
            vertices: state.vertices.map((v) => v.id === id ? { ...v, x, y } : v),
        }));
        syncObjectCache(target.objectId, get().vertices);
        if (getSaveMode() === "autosave") {
            const updated = get().vertices.find((v) => v.id === id)!;
            saveEnvVertex(updated).catch(console.error);
        }
    },

    deleteObjectVertices: (objectId) => {
        set((state) => ({
            vertices: state.vertices.filter((v) => v.objectId !== objectId),
        }));
    },

    save: async () => {
        await saveEnvVertices(get().vertices);
    },

    loadByObjectIds: async (objectIds) => {
        const results = await Promise.all(objectIds.map((id) => getEnvVerticesByObject(id)));
        const loaded = results.flat();
        set((state) => {
            const others = state.vertices.filter((v) => !objectIds.includes(v.objectId));
            return { vertices: [...others, ...loaded] };
        });
    },
}));
