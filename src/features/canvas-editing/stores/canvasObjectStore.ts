import { create } from "zustand";
import type { EnvObject, EnvVertex } from "@/types/envTypes";
import type { ObjectCategory, ObjectType } from "@/config/db-ops/enums";
import { objectVertices, shoelaceArea } from "@/features/canvas-editing/utils/canvasGeometry";
import { syncObject, markDirty, markDeleted } from "@/features/canvas-editing/utils/canvasObjectUtils";

// ---------------------------------------------------------------------------
// ID generator
// ---------------------------------------------------------------------------

let _idCounter = 1000;
function nextId(): number {
    return ++_idCounter;
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

function buildSampleData(): { objects: EnvObject[]; vertices: EnvVertex[] } {
    const zoneId = 1;
    const obstacleId = 2;

    const zv1 = 10, zv2 = 11, zv3 = 12, zv4 = 13;
    const ov1 = 20, ov2 = 21, ov3 = 22;

    const vertices: EnvVertex[] = [
        { id: zv1, objectId: zoneId, nextVertexId: zv2, x: 120, y: 100 },
        { id: zv2, objectId: zoneId, nextVertexId: zv3, x: 320, y: 100 },
        { id: zv3, objectId: zoneId, nextVertexId: zv4, x: 320, y: 260 },
        { id: zv4, objectId: zoneId, nextVertexId: null, x: 120, y: 260 },
        { id: ov1, objectId: obstacleId, nextVertexId: ov2, x: 180, y: 150 },
        { id: ov2, objectId: obstacleId, nextVertexId: ov3, x: 260, y: 150 },
        { id: ov3, objectId: obstacleId, nextVertexId: null, x: 260, y: 210 },
    ];

    const objects: EnvObject[] = [
        {
            id: zoneId,
            environmentId: 0,
            category: "zone",
            type: "offline",
            vertexCount: 4,
            area: shoelaceArea(vertices.filter((v) => v.objectId === zoneId)),
        },
        {
            id: obstacleId,
            environmentId: 0,
            category: "obstacle",
            type: "offline",
            vertexCount: 3,
            area: shoelaceArea(vertices.filter((v) => v.objectId === obstacleId)),
        },
    ];

    return { objects, vertices };
}

const SAMPLE = buildSampleData();

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
    deletedVertexIds: Set<number>;

    addObject: (category: ObjectCategory, points: { x: number; y: number }[], type: ObjectType) => void;
    deleteObject: (id: number) => void;
    updateVertex: (objectId: number, vertexIndex: number, x: number, y: number) => void;
    moveObject: (objectId: number, dx: number, dy: number) => void;
    deleteVertex: (objectId: number, vertexIndex: number) => void;
    deleteVertices: (objectId: number, indices: number[]) => void;
    insertVertex: (objectId: number, afterIndex: number, x: number, y: number) => number;
    /** Call this after a successful DB save to reset tracking. */
    clearDirty: () => void;
}

export const useCanvasObjectStore = create<CanvasObjectState>()((set) => ({
    objects: SAMPLE.objects,
    vertices: SAMPLE.vertices,
    dirtyObjectIds: new Set<number>(),
    dirtyVertexIds: new Set<number>(),
    deletedObjectIds: new Set<number>(),
    deletedVertexIds: new Set<number>(),

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
                environmentId: 0,
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
                ({ dirty: dVtx, deleted: xVtx } = markDirty(dVtx, xVtx, v.id));
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
                ({ dirty: dVtx, deleted: xVtx } = markDeleted(dVtx, xVtx, v.id));
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
            ({ dirty: dVtx, deleted: xVtx } = markDirty(dVtx, xVtx, target.id));

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
                ({ dirty: dVtx, deleted: xVtx } = markDirty(dVtx, xVtx, v.id));
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
            ({ dirty: dVtx, deleted: xVtx } = markDeleted(dVtx, xVtx, target.id));
            for (const v of objectVertices(newVertices, objectId)) {
                ({ dirty: dVtx, deleted: xVtx } = markDirty(dVtx, xVtx, v.id));
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
                ({ dirty: dVtx, deleted: xVtx } = markDeleted(dVtx, xVtx, v.id));
            }
            for (const v of objectVertices(newVertices, objectId)) {
                ({ dirty: dVtx, deleted: xVtx } = markDirty(dVtx, xVtx, v.id));
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
                ({ dirty: dVtx, deleted: xVtx } = markDirty(dVtx, xVtx, v.id));
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
            deletedVertexIds: new Set<number>(),
        }),
}));
