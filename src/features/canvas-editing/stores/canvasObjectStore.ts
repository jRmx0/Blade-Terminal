import { create } from "zustand";
import type { Object, Vertex } from "@/types/schemaTypes";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";
import { type ObjectCategory, type ObjectType } from "@/config/db-ops/enums";
import { useEnvStore } from "@/stores/envStore";
import { objectVertices } from "@/features/canvas-editing/utils/canvasGeometry";
import { syncObject, markDirty, markDeleted, markVertexDirty, markVertexDeleted } from "@/features/canvas-editing/utils/canvasObjectUtils";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface CanvasObjectState {
    objects: Object[];
    vertices: Vertex[];

    dirtyObjects: Object[];
    dirtyVertices: Vertex[];
    deletedObjects: Object[];
    deletedVertices: Vertex[];

    /** Adds a new polygon object with the given vertices. Marks object and all vertices dirty. */
    addObject: (category: ObjectCategory, points: Point[], type: ObjectType) => void;
    /** Removes an object and all its vertices. Marks them as deleted. */
    deleteObject: (obj: Object) => void;
    /** Updates x,y of a single vertex during drag — no sync, no dirty tracking. Call finalizeVertexMove on drag end. */
    moveVertexXY: (vertex: Vertex, pos: Point) => void;
    /** Runs syncObject + marks dirty once after a vertex drag completes. Reads current x,y from store state. */
    finalizeVertexMove: (vertex: Vertex) => void;
    /** Translates all vertices of an object by (dx, dy). Marks object and all vertices dirty. */
    moveObject: (obj: Object, dx: number, dy: number) => void;
    /** Removes a vertex from an object. No-op when the object has ≤ 3 vertices. */
    deleteVertex: (obj: Object, vertex: Vertex) => void;
    /** Removes multiple vertices. No-op when the result would have fewer than 3 vertices. */
    deleteVertices: (obj: Object, vertices: Vertex[]) => void;
    /** Inserts a new vertex after the given vertex. Returns the new Vertex. */
    insertVertex: (afterVertex: Vertex, pos: Point) => Vertex;
    /** Updates the type of a single object. Marks it dirty. */
    updateObjectType: (obj: Object, type: ObjectType) => void;
    /** Bulk-updates the type of every object. Marks all dirty. */
    updateObjectsType: (type: ObjectType) => void;
    /** Resets dirty tracking. Called by canvas bridge after a successful save. */
    clearDirty: () => void;
    /** Replaces all in-memory objects and vertices and resets dirty tracking. Used by the canvas bridge for load and reset. */
    setObjects: (objects: Object[], vertices: Vertex[]) => void;
}

/** Selector: true when there are unsaved canvas changes. */
export const selectIsDirty = (s: CanvasObjectState): boolean =>
    s.dirtyObjects.length > 0 ||
    s.dirtyVertices.length > 0 ||
    s.deletedObjects.length > 0 ||
    s.deletedVertices.length > 0;

export const useCanvasObjectStore = create<CanvasObjectState>()((set, get) => ({
    objects: [],
    vertices: [],
    dirtyObjects: [],
    dirtyVertices: [],
    deletedObjects: [],
    deletedVertices: [],

    addObject: (category, points, type) => {
        const envId = useEnvStore.getState().env.id;
        const inMemoryMax = Math.max(0, ...get().objects.filter((o) => o.environmentId === envId).map((o) => o.id));
        const objectId = inMemoryMax + 1;
        set((state) => {
            const newVertices: Vertex[] = points.map((p, i) => ({
                id: i + 1,
                objectId,
                environmentId: envId,
                nextVertexId: null, // fixed by syncObject
                x: p.x,
                y: p.y,
            }));
            const newObject: Object = {
                id: objectId,
                environmentId: envId,
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

            let dObj = state.dirtyObjects, xObj = state.deletedObjects;
            let dVtx = state.dirtyVertices, xVtx = state.deletedVertices;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, synced.objects.find((o) => o.id === objectId)!));
            for (const v of objectVertices(synced.vertices, objectId)) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, v));
            }

            return { ...synced, dirtyObjects: dObj, dirtyVertices: dVtx, deletedObjects: xObj, deletedVertices: xVtx };
        });
    },

    deleteObject: (obj) => {
        set((state) => {
            if (!state.objects.some((o) => o.id === obj.id)) return state;
            const toDelete = objectVertices(state.vertices, obj.id);

            let dObj = state.dirtyObjects, xObj = state.deletedObjects;
            let dVtx = state.dirtyVertices, xVtx = state.deletedVertices;
            ({ dirty: dObj, deleted: xObj } = markDeleted(dObj, xObj, obj));
            for (const v of toDelete) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDeleted(dVtx, xVtx, v));
            }

            return {
                objects: state.objects.filter((o) => o.id !== obj.id),
                vertices: state.vertices.filter((v) => v.objectId !== obj.id),
                dirtyObjects: dObj, dirtyVertices: dVtx, deletedObjects: xObj, deletedVertices: xVtx,
            };
        });
    },

    moveVertexXY: (vertex, pos) =>
        set((state) => ({
            vertices: state.vertices.map((v) =>
                v.id === vertex.id && v.objectId === vertex.objectId ? { ...v, x: pos.x, y: pos.y } : v,
            ),
        })),

    finalizeVertexMove: (vertex) =>
        set((state) => {
            const synced = syncObject(state.objects, state.vertices, vertex.objectId);
            const syncedVertex = synced.vertices.find((v) => v.id === vertex.id && v.objectId === vertex.objectId)!;

            let dObj = state.dirtyObjects, xObj = state.deletedObjects;
            let dVtx = state.dirtyVertices, xVtx = state.deletedVertices;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, synced.objects.find((o) => o.id === vertex.objectId)!));
            ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, syncedVertex));

            return { ...synced, dirtyObjects: dObj, dirtyVertices: dVtx, deletedObjects: xObj, deletedVertices: xVtx };
        }),

    moveObject: (obj, dx, dy) =>
        set((state) => {
            const newVertices = state.vertices.map((v) =>
                v.objectId === obj.id ? { ...v, x: v.x + dx, y: v.y + dy } : v,
            );
            const synced = syncObject(state.objects, newVertices, obj.id);

            let dObj = state.dirtyObjects, xObj = state.deletedObjects;
            let dVtx = state.dirtyVertices, xVtx = state.deletedVertices;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, synced.objects.find((o) => o.id === obj.id)!));
            for (const v of objectVertices(synced.vertices, obj.id)) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, v));
            }

            return { ...synced, dirtyObjects: dObj, dirtyVertices: dVtx, deletedObjects: xObj, deletedVertices: xVtx };
        }),

    deleteVertex: (obj, vertex) =>
        set((state) => {
            const objVerts = objectVertices(state.vertices, obj.id);
            if (objVerts.length <= 3) return state;
            if (!objVerts.some((v) => v.id === vertex.id)) return state;

            const newVertices = state.vertices.filter((v) => !(v.id === vertex.id && v.objectId === obj.id));
            const synced = syncObject(state.objects, newVertices, obj.id);

            let dObj = state.dirtyObjects, xObj = state.deletedObjects;
            let dVtx = state.dirtyVertices, xVtx = state.deletedVertices;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, synced.objects.find((o) => o.id === obj.id)!));
            ({ dirty: dVtx, deleted: xVtx } = markVertexDeleted(dVtx, xVtx, vertex));
            for (const v of objectVertices(synced.vertices, obj.id)) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, v));
            }

            return { ...synced, dirtyObjects: dObj, dirtyVertices: dVtx, deletedObjects: xObj, deletedVertices: xVtx };
        }),

    deleteVertices: (obj, vertices) =>
        set((state) => {
            const objVerts = objectVertices(state.vertices, obj.id);
            if (objVerts.length - vertices.length < 3) return state;

            const toDeleteIds = new Set(vertices.map((v) => v.id));
            const toDelete = objVerts.filter((v) => toDeleteIds.has(v.id));
            const newVertices = state.vertices.filter((v) => !(v.objectId === obj.id && toDeleteIds.has(v.id)));
            const synced = syncObject(state.objects, newVertices, obj.id);

            let dObj = state.dirtyObjects, xObj = state.deletedObjects;
            let dVtx = state.dirtyVertices, xVtx = state.deletedVertices;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, synced.objects.find((o) => o.id === obj.id)!));
            for (const v of toDelete) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDeleted(dVtx, xVtx, v));
            }
            for (const v of objectVertices(synced.vertices, obj.id)) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, v));
            }

            return { ...synced, dirtyObjects: dObj, dirtyVertices: dVtx, deletedObjects: xObj, deletedVertices: xVtx };
        }),

    insertVertex: (afterVertex, pos) => {
        const { objectId } = afterVertex;
        const inMemoryMax = Math.max(0, ...objectVertices(get().vertices, objectId).map((v) => v.id));
        const envId = useEnvStore.getState().env.id;
        const newVertex: Vertex = { id: inMemoryMax + 1, objectId, environmentId: envId, nextVertexId: null, x: pos.x, y: pos.y };
        set((state) => {
            const globalAfterIndex = state.vertices.findIndex((v) => v.id === afterVertex.id && v.objectId === objectId);
            if (globalAfterIndex === -1) return state;

            const newVertices = [
                ...state.vertices.slice(0, globalAfterIndex + 1),
                newVertex,
                ...state.vertices.slice(globalAfterIndex + 1),
            ];
            const synced = syncObject(state.objects, newVertices, objectId);

            let dObj = state.dirtyObjects, xObj = state.deletedObjects;
            let dVtx = state.dirtyVertices, xVtx = state.deletedVertices;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, synced.objects.find((o) => o.id === objectId)!));
            for (const v of objectVertices(synced.vertices, objectId)) {
                ({ dirty: dVtx, deleted: xVtx } = markVertexDirty(dVtx, xVtx, v));
            }

            return { ...synced, dirtyObjects: dObj, dirtyVertices: dVtx, deletedObjects: xObj, deletedVertices: xVtx };
        });
        return newVertex;
    },

    updateObjectType: (obj, type) =>
        set((state) => {
            if (!state.objects.some((o) => o.id === obj.id)) return state;

            const updated = { ...obj, type };
            const newObjects = state.objects.map((o) => o.id === obj.id ? updated : o);
            let dObj = state.dirtyObjects, xObj = state.deletedObjects;
            ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, updated));

            return { objects: newObjects, dirtyObjects: dObj, deletedObjects: xObj };
        }),

    updateObjectsType: (type) =>
        set((state) => {
            if (state.objects.length === 0) return state;

            const newObjects = state.objects.map((o) => ({ ...o, type }));
            let dObj = state.dirtyObjects, xObj = state.deletedObjects;
            for (const o of newObjects) {
                ({ dirty: dObj, deleted: xObj } = markDirty(dObj, xObj, o));
            }

            return { objects: newObjects, dirtyObjects: dObj, deletedObjects: xObj };
        }),

    clearDirty: () =>
        set({
            dirtyObjects: [],
            dirtyVertices: [],
            deletedObjects: [],
            deletedVertices: [],
        }),

    setObjects: (objects, vertices) =>
        set({
            objects,
            vertices,
            dirtyObjects: [],
            dirtyVertices: [],
            deletedObjects: [],
            deletedVertices: [],
        }),
}));
