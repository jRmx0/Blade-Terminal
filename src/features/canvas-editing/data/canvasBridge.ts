import { getLastEnvironmentId, saveEnvironment } from "@server/db/environments";
import { saveComputationSelection } from "@server/db/computationSelection";
import { saveAlgorithmParameters } from "@server/db/computationAlgorithmParameters";
import { saveAllLayerSettings } from "@server/db/layerSettings";
import { getObjectsByEnvironment, saveObjects, deleteObject } from "@server/db/objects";
import { getVerticesByObjects, saveVertices, deleteVertex } from "@server/db/vertices";
import { OBJECT_CATEGORY } from "@/config/db-ops/enums";
import type { Object, Vertex, Environment } from "@/types/schemaTypes";
import { useCanvasObjectStore } from "../stores/canvasObjectStore";
import { useEnvStore } from "@/stores/envStore";
import { useParameterValuesStore } from "@/stores/parameterValuesStore";
import { useLayerSettingsStore } from "@/stores/layerSettingsStore";

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

/** Returns the next sequential environment ID (max existing + 1, or 1 when the table is empty). */
export async function resolveNextEnvironmentId(): Promise<number> {
    const max = await getLastEnvironmentId();
    return max + 1;
}

// ── Canvas save ────────────────────────────────────────────────────────────

let _isSaving = false;

async function persistDirtyObjects(dirtyObjects: Object[], deletedObjects: Object[]): Promise<void> {
    await Promise.all([
        dirtyObjects.length > 0 ? saveObjects(dirtyObjects) : Promise.resolve(),
        ...deletedObjects.map((obj) => deleteObject(obj)),
    ]);
}

async function persistDirtyVertices(dirtyVertices: Vertex[], deletedVertices: Vertex[]): Promise<void> {
    await Promise.all([
        dirtyVertices.length > 0 ? saveVertices(dirtyVertices) : Promise.resolve(),
        ...deletedVertices.map((v) => deleteVertex(v)),
    ]);
}

/**
 * Persists all dirty canvas state and environment metadata to IndexedDB.
 * Returns true when data was actually written to IndexedDB, false when nothing
 * was dirty or a save was already in progress.
 */
export async function saveCanvas(): Promise<boolean> {
    if (_isSaving) return false;

    const { dirtyObjects, dirtyVertices, deletedObjects, deletedVertices, clearDirty } =
        useCanvasObjectStore.getState();
    const { env, isEnvDirty, computation, clearDirty: clearEnvDirty } = useEnvStore.getState();
    const { parameterValues, isParameterValuesDirty, clearDirty: clearParamsDirty } = useParameterValuesStore.getState();
    const { layers, isLayerSettingsDirty, clearDirty: clearLayersDirty } = useLayerSettingsStore.getState();

    if (!isEnvDirty && !isParameterValuesDirty && !isLayerSettingsDirty && !dirtyObjects.length && !deletedObjects.length && !dirtyVertices.length && !deletedVertices.length) return false;

    _isSaving = true;
    try {
        await Promise.all([
            saveEnvironment(env),
            saveComputationSelection(computation),
            isParameterValuesDirty ? saveAlgorithmParameters(parameterValues) : Promise.resolve(),
            isLayerSettingsDirty ? saveAllLayerSettings(layers.flatMap((l) => l.settings)) : Promise.resolve(),
            persistDirtyObjects(dirtyObjects, deletedObjects),
            persistDirtyVertices(dirtyVertices, deletedVertices),
        ]);
        clearDirty();
        clearEnvDirty();
        clearParamsDirty();
        clearLayersDirty();
        return true;
    } finally {
        _isSaving = false;
    }
}

// ── Canvas load ────────────────────────────────────────────────────────────

/**
 * Walks the nextVertexId linked list to restore draw order for one object's vertices.
 * Dexie returns rows in primary-key (id) order, so a vertex inserted as id=5
 * between id=2 and id=3 would come back last without this step.
 * Falls back to the original array if the chain is broken or incomplete.
 */
function sortByLinkedList(group: Vertex[]): Vertex[] {
    if (group.length <= 1) return group;
    const nextIds = new Set(group.map((v) => v.nextVertexId).filter((id): id is number => id !== null));
    const head = group.find((v) => !nextIds.has(v.id));
    if (!head) return group;
    const byId = new Map(group.map((v) => [v.id, v]));
    const ordered: Vertex[] = [];
    const visited = new Set<number>();
    let current: Vertex | undefined = head;
    while (current && !visited.has(current.id)) {
        ordered.push(current);
        visited.add(current.id);
        current = current.nextVertexId !== null ? byId.get(current.nextVertexId) : undefined;
    }
    return ordered.length === group.length ? ordered : group;
}

function restoreVertexOrder(vertices: Vertex[]): Vertex[] {
    const byObject = new Map<number, Vertex[]>();
    for (const v of vertices) {
        const group = byObject.get(v.objectId) ?? [];
        group.push(v);
        byObject.set(v.objectId, group);
    }
    const result: Vertex[] = [];
    for (const group of byObject.values()) {
        result.push(...sortByLinkedList(group));
    }
    return result;
}

/**
 * Loads objects and vertices for an environment from IndexedDB and hydrates
 * the canvas store. Seeds the ID counter to prevent future collisions.
 */
export async function loadCanvasForEnvironment(env: Environment): Promise<void> {
    const objects = await getObjectsByEnvironment(env);
    const rawVertices = objects.length > 0
        ? await getVerticesByObjects(objects)
        : [];
    useCanvasObjectStore.getState().setObjects(objects, restoreVertexOrder(rawVertices));
}
