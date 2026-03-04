import { getMaxEnvironmentId, saveEnvironment } from "@server/db/environments";
import { getMaxEnvObjectId, getObjectsByEnvironment, saveObjects, deleteObject } from "@server/db/objects";
import { getMaxVertexId, getVerticesByObjectIds, saveVertices, deleteVertex } from "@server/db/vertices";
import { OBJECT_CATEGORY } from "@/config/db-ops/enums";
import type { Object, Vertex } from "@/types/schemaTypes";
import { useCanvasObjectStore, seedIdCounter } from "../stores/canvasObjectStore";
import { useEnvStore } from "@/stores/envStore";

// ── Count synchronization ──────────────────────────────────────────────────
// Reactively keeps envStore zone/obstacle counts derived from the canvas object
// list. Lives here (not in either store) to avoid a circular import.

function countByCategory(objects: Object[], category: string): number {
    return objects.filter((o) => o.category === category).length;
}

function syncEnvCounts(objects: Object[]): void {
    const zoneObjectCount = countByCategory(objects, OBJECT_CATEGORY.ZONE);
    const obstacleObjectCount = countByCategory(objects, OBJECT_CATEGORY.OBSTACLE);
    useEnvStore.setState((s) => ({ env: { ...s.env, zoneCount: zoneObjectCount, obstacleCount: obstacleObjectCount } }));
}

useCanvasObjectStore.subscribe((next, prev) => {
    if (next.objects !== prev.objects) syncEnvCounts(next.objects);
});

// ── ID counter ─────────────────────────────────────────────────────────────

/** Seeds the canvas ID counter from the highest IDs currently stored in IndexedDB. */
export async function seedIdCounterFromDb(): Promise<void> {
    const [maxObjId, maxVtxId] = await Promise.all([getMaxEnvObjectId(), getMaxVertexId()]);
    seedIdCounter(Math.max(maxObjId, maxVtxId));
}

/** Returns the next sequential environment ID (max existing + 1, or 1 when the table is empty). */
export async function resolveNextEnvironmentId(): Promise<number> {
    const max = await getMaxEnvironmentId();
    return max + 1;
}

// ── Canvas save ────────────────────────────────────────────────────────────

let _isSaving = false;

function hasUnsavedChanges(
    isEnvDirty: boolean,
    dirtyObjectIds: Set<number>,
    dirtyVertexIds: Set<number>,
    deletedObjectIds: Set<number>,
    deletedVertexIds: Map<number, number>,
): boolean {
    return (
        isEnvDirty ||
        dirtyObjectIds.size > 0 ||
        dirtyVertexIds.size > 0 ||
        deletedObjectIds.size > 0 ||
        deletedVertexIds.size > 0
    );
}

async function persistDirtyObjects(
    objects: Object[],
    dirtyObjectIds: Set<number>,
    deletedObjectIds: Set<number>,
    environmentId: number,
): Promise<void> {
    const dirty = objects.filter((o) => dirtyObjectIds.has(o.id));
    await Promise.all([
        dirty.length > 0 ? saveObjects(dirty) : Promise.resolve(),
        ...[...deletedObjectIds].map((id) => deleteObject(id, environmentId)),
    ]);
}

async function persistDirtyVertices(
    vertices: Vertex[],
    dirtyVertexIds: Set<number>,
    deletedVertexIds: Map<number, number>,
): Promise<void> {
    const dirty = vertices.filter((v) => dirtyVertexIds.has(v.id));
    await Promise.all([
        dirty.length > 0 ? saveVertices(dirty) : Promise.resolve(),
        ...[...deletedVertexIds.entries()].map(([id, objectId]) => deleteVertex(id, objectId)),
    ]);
}

/**
 * Persists all dirty canvas state and environment metadata to IndexedDB.
 * No-ops when nothing has changed or a save is already in progress.
 */
export async function saveCanvas(): Promise<void> {
    if (_isSaving) return;

    const { objects, vertices, dirtyObjectIds, dirtyVertexIds, deletedObjectIds, deletedVertexIds, clearDirty } =
        useCanvasObjectStore.getState();
    const { env, isEnvDirty, clearDirty: clearEnvDirty } = useEnvStore.getState();

    if (!hasUnsavedChanges(isEnvDirty, dirtyObjectIds, dirtyVertexIds, deletedObjectIds, deletedVertexIds)) return;

    _isSaving = true;
    try {
        await Promise.all([
            saveEnvironment(env),
            persistDirtyObjects(objects, dirtyObjectIds, deletedObjectIds, env.id),
            persistDirtyVertices(vertices, dirtyVertexIds, deletedVertexIds),
        ]);
        clearDirty();
        clearEnvDirty();
    } finally {
        _isSaving = false;
    }
}

// ── Canvas load ────────────────────────────────────────────────────────────

/**
 * Loads objects and vertices for an environment from IndexedDB and hydrates
 * the canvas store. Seeds the ID counter to prevent future collisions.
 */
export async function loadCanvasForEnvironment(environmentId: number): Promise<void> {
    const objects = await getObjectsByEnvironment(environmentId);
    const vertices = objects.length > 0
        ? await getVerticesByObjectIds(objects.map((o) => o.id))
        : [];
    const maxId = Math.max(0, ...objects.map((o) => o.id), ...vertices.map((v) => v.id));
    seedIdCounter(maxId);
    useCanvasObjectStore.getState().setObjects(objects, vertices);
}
