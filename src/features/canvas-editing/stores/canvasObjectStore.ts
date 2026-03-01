import { create } from "zustand";
import type { EnvObject, EnvVertex } from "@/types/envTypes";
import type { ObjectCategory, ObjectType } from "@/config/db-ops/enums";
import { objectVertices } from "@/features/canvas-editing/utils/canvasGeometry";
import { syncObject, markDirty, markDeleted, markVertexDirty, markVertexDeleted } from "@/features/canvas-editing/utils/canvasObjectUtils";
import { useEnvStore } from "@/stores/envStore";
import { getEnvObjectsByEnvironment } from "@server/db/env-objects";
import { getEnvVerticesByObjectIds } from "@server/db/env-vertices";

// ---------------------------------------------------------------------------
// ID generator
// ---------------------------------------------------------------------------

let _idCounter = 0;
function nextId(): number {
    return ++_idCounter;
}

/** Raises the id counter to at least `maxId`. Call after loading objects from DB to prevent collisions. */
export function seedIdCounter(maxId: number): void {
    if (maxId > _idCounter) _idCounter = maxId;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface CanvasObjectState {
    objects: EnvObject[];
    vertices: EnvVertex[];

    /** IDs that have been created or mutated since the last clearDirty(). */
    dirtyObjectIds: Set<number>;
    dirtyVertexIds: Set<number>;
    /** IDs that have been removed since the last clearDirty(). */
    deletedObjectIds: Set<number>;
    /** Map of vertexId → objectId for vertices deleted since the last clearDirty(). */
    deletedVertexIds: Map<number, number>;

    addObject: (category: ObjectCategory, points: { x: number; y: number }[], type: ObjectType) => void;
    deleteObject: (id: number) => void;
    updateVertex: (objectId: number, vertexIndex: number, x: number, y: number) => void;
    moveObject: (objectId: number, dx: number, dy: number) => void;
    deleteVertex: (objectId: number, vertexIndex: number) => void;
    deleteVertices: (objectId: number, indices: number[]) => void;
    insertVertex: (objectId: number, afterIndex: number, x: number, y: number) => number;
    /** Call this after a successful DB save to reset tracking. */
    clearDirty: () => void;
    /** Loads objects and vertices for an environment from DB, replacing current state. Dirty sets are cleared. */
    load: (environmentId: number) => Promise<void>;
}

export const useCanvasObjectStore = create<CanvasObjectState>()((set) => ({
    objects: [],
    vertices: [],
    dirtyObjectIds: new Set<number>(),
    dirtyVertexIds: new Set<number>(),
    deletedObjectIds: new Set<number>(),
    deletedVertexIds: new Map<number, number>(),

    addObject: (category, points, type) =>
        set((state) => {
            const objectId = nextId();
            const newVertices: EnvVertex[] = points.map((p) => ({
                id: nextId(),
                objectId,
                nextVertexId: null, // fixed by syncObject
                x: p.x,
                y: p.y,
            }));
            const newObject: EnvObject = {
                id: objectId,
                environmentId: useEnvStore.getState().env.id,
                category,
                type,
                vertexCount: 0, // fixed by syncObject
                area: 0,
            };
            const synced = syncObject(
                [...state.objects, newObject],
                [...state.vertices, ...newVertices],
                objectId,
            );

            let dObj = state.dirtyObjectIds, xObj = state.deletedObjectIds;
            let dVtx = state.dirtyVertexIds, xVtx = state.deletedVertexIds;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, objectId));
            for (const v of newVertices) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, v.id));
            }

            return { ...synced, dirtyObjectIds: dObj, dirtyVertexIds: dVtx, deletedObjectIds: xObj, deletedVertexIds: xVtx };
        }),

    deleteObject: (id) =>
        set((state) => {
            const toDelete = objectVertices(state.vertices, id);

            let dObj = state.dirtyObjectIds, xObj = state.deletedObjectIds;
            let dVtx = state.dirtyVertexIds, xVtx = state.deletedVertexIds;
            ({ dirty: dObj, deleted: xObj } = markDeleted(dObj, xObj, id));
            for (const v of toDelete) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDeleted(dVtx, xVtx, v.id, v.objectId));
            }

            return {
                objects: state.objects.filter((o) => o.id !== id),
                vertices: state.vertices.filter((v) => v.objectId !== id),
                dirtyObjectIds: dObj, dirtyVertexIds: dVtx, deletedObjectIds: xObj, deletedVertexIds: xVtx,
            };
        }),

    updateVertex: (objectId, vertexIndex, x, y) =>
        set((state) => {
            const objVerts = objectVertices(state.vertices, objectId);
            const target = objVerts[vertexIndex];
            if (!target) return state;

            const newVertices = state.vertices.map((v) => (v.id === target.id ? { ...v, x, y } : v));
            const synced = syncObject(state.objects, newVertices, objectId);

            let dObj = state.dirtyObjectIds, xObj = state.deletedObjectIds;
            let dVtx = state.dirtyVertexIds, xVtx = state.deletedVertexIds;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, objectId));
            ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, target.id));

            return { ...synced, dirtyObjectIds: dObj, dirtyVertexIds: dVtx, deletedObjectIds: xObj, deletedVertexIds: xVtx };
        }),

    moveObject: (objectId, dx, dy) =>
        set((state) => {
            const newVertices = state.vertices.map((v) =>
                v.objectId === objectId ? { ...v, x: v.x + dx, y: v.y + dy } : v,
            );
            const synced = syncObject(state.objects, newVertices, objectId);

            let dObj = state.dirtyObjectIds, xObj = state.deletedObjectIds;
            let dVtx = state.dirtyVertexIds, xVtx = state.deletedVertexIds;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, objectId));
            for (const v of objectVertices(state.vertices, objectId)) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, v.id));
            }

            return { ...synced, dirtyObjectIds: dObj, dirtyVertexIds: dVtx, deletedObjectIds: xObj, deletedVertexIds: xVtx };
        }),

    deleteVertex: (objectId, vertexIndex) =>
        set((state) => {
            const objVerts = objectVertices(state.vertices, objectId);
            if (objVerts.length <= 3) return state;
            const target = objVerts[vertexIndex];
            if (!target) return state;

            const newVertices = state.vertices.filter((v) => v.id !== target.id);
            const synced = syncObject(state.objects, newVertices, objectId);

            let dObj = state.dirtyObjectIds, xObj = state.deletedObjectIds;
            let dVtx = state.dirtyVertexIds, xVtx = state.deletedVertexIds;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, objectId));
            ({ dirty: dVtx, deleted: xVtx } = markVertexDeleted(dVtx, xVtx, target.id, objectId));
            for (const v of objectVertices(newVertices, objectId)) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, v.id));
            }

            return { ...synced, dirtyObjectIds: dObj, dirtyVertexIds: dVtx, deletedObjectIds: xObj, deletedVertexIds: xVtx };
        }),

    deleteVertices: (objectId, indices) =>
        set((state) => {
            const objVerts = objectVertices(state.vertices, objectId);
            if (objVerts.length - indices.length < 3) return state;

            const indexSet = new Set(indices);
            const toDelete = objVerts.filter((_, i) => indexSet.has(i));
            const toDeleteIds = new Set(toDelete.map((v) => v.id));
            const newVertices = state.vertices.filter((v) => !(v.objectId === objectId && toDeleteIds.has(v.id)));
            const synced = syncObject(state.objects, newVertices, objectId);

            let dObj = state.dirtyObjectIds, xObj = state.deletedObjectIds;
            let dVtx = state.dirtyVertexIds, xVtx = state.deletedVertexIds;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, objectId));
            for (const v of toDelete) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDeleted(dVtx, xVtx, v.id, v.objectId));
            }
            for (const v of objectVertices(newVertices, objectId)) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, v.id));
            }

            return { ...synced, dirtyObjectIds: dObj, dirtyVertexIds: dVtx, deletedObjectIds: xObj, deletedVertexIds: xVtx };
        }),

    insertVertex: (objectId, afterIndex, x, y) => {
        const newId = nextId();
        set((state) => {
            const objVerts = objectVertices(state.vertices, objectId);
            const afterVertex = objVerts[afterIndex];
            if (!afterVertex) return state;

            const globalAfterIndex = state.vertices.findIndex((v) => v.id === afterVertex.id);
            const newVertex: EnvVertex = { id: newId, objectId, nextVertexId: null, x, y };
            const newVertices = [
                ...state.vertices.slice(0, globalAfterIndex + 1),
                newVertex,
                ...state.vertices.slice(globalAfterIndex + 1),
            ];
            const synced = syncObject(state.objects, newVertices, objectId);

            let dObj = state.dirtyObjectIds, xObj = state.deletedObjectIds;
            let dVtx = state.dirtyVertexIds, xVtx = state.deletedVertexIds;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, objectId));
            for (const v of objectVertices(newVertices, objectId)) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, v.id));
            }

            return { ...synced, dirtyObjectIds: dObj, dirtyVertexIds: dVtx, deletedObjectIds: xObj, deletedVertexIds: xVtx };
        });
        return newId;
    },

    clearDirty: () =>
        set({
            dirtyObjectIds: new Set<number>(),
            dirtyVertexIds: new Set<number>(),
            deletedObjectIds: new Set<number>(),
            deletedVertexIds: new Map<number, number>(),
        }),

    load: async (environmentId) => {
        const objects = await getEnvObjectsByEnvironment(environmentId);
        const vertices = objects.length > 0
            ? await getEnvVerticesByObjectIds(objects.map((o) => o.id))
            : [];
        // Seed counter above all loaded IDs to prevent future collisions
        const maxId = Math.max(0, ...objects.map((o) => o.id), ...vertices.map((v) => v.id));
        seedIdCounter(maxId);
        set({
            objects,
            vertices,
            dirtyObjectIds: new Set<number>(),
            dirtyVertexIds: new Set<number>(),
            deletedObjectIds: new Set<number>(),
            deletedVertexIds: new Map<number, number>(),
        });
    },
}));
