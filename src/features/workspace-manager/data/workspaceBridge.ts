import { getEnvironment, saveEnvironment } from "@server/db/environments";
import { deleteEnvObjectsByEnvironment, saveEnvObjects } from "@server/db/env-objects";
import { saveEnvVertices } from "@server/db/env-vertices";
import { ENV_FORMAT, OBJECT_TYPE, OBJECT_CATEGORY } from "@/config/db-ops/enums";
import type { Environment } from "@/types/envTypes";
import { useEnvStore } from "@/stores/envStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasHistoryStore } from "@/features/canvas-editing/stores/canvasHistoryStore";
import { useSaveModeStore } from "@/stores/saveModeStore";
import { seedIdCounterFromDb, resolveNextEnvironmentId, loadCanvasForEnvironment } from "@/features/canvas-editing/data/canvasBridge";

const BLANK_ENV: Omit<Environment, "id"> = {
    name: "Untitled Environment",
    format: ENV_FORMAT.POLYGON,
    type: OBJECT_TYPE.OFFLINE,
    zoneObjectCount: 0,
    obstacleObjectCount: 0,
};

function countByCategory(objects: { category: string }[], category: string): number {
    return objects.filter((o) => o.category === category).length;
}

/** Initializes a fresh blank environment at app startup. Seeds the ID counter from IndexedDB. */
export async function initializeWorkspace(): Promise<void> {
    await seedIdCounterFromDb();
    const nextId = await resolveNextEnvironmentId();
    useEnvStore.getState().setEnv({ ...BLANK_ENV, id: nextId });
}

/** Discards the current environment and starts a blank one without saving. */
export async function resetWorkspace(): Promise<void> {
    await seedIdCounterFromDb();
    const nextId = await resolveNextEnvironmentId();
    useEnvStore.getState().setEnv({ ...BLANK_ENV, id: nextId });
    useEnvStore.getState().clearDirty();
    useSaveModeStore.getState().setMode("session");
    useCanvasObjectStore.getState().setObjects([], []);
    useCanvasHistoryStore.getState().resetHistory();
}

/** Loads an existing environment and its canvas objects from IndexedDB. */
export async function loadWorkspace(environmentId: number): Promise<void> {
    const env = await getEnvironment(environmentId);
    if (!env) return;
    useSaveModeStore.getState().setMode("manual");
    await loadCanvasForEnvironment(environmentId);
    const { objects } = useCanvasObjectStore.getState();
    const zoneObjectCount = countByCategory(objects, OBJECT_CATEGORY.ZONE);
    const obstacleObjectCount = countByCategory(objects, OBJECT_CATEGORY.OBSTACLE);
    useEnvStore.getState().setEnv({ ...env, zoneObjectCount, obstacleObjectCount });
    useCanvasHistoryStore.getState().resetHistory();
}

/** Saves the current canvas as a new environment or overwrites an existing one, then loads it. */
export async function saveAsWorkspace(name: string, selectedEnvId: number | null): Promise<void> {
    const { env } = useEnvStore.getState();
    const { objects, vertices } = useCanvasObjectStore.getState();
    const targetId = selectedEnvId ?? (await resolveNextEnvironmentId());
    const targetEnv: Environment = { ...env, id: targetId, name };
    if (selectedEnvId !== null) {
        await deleteEnvObjectsByEnvironment(targetId);
    }
    const targetObjects = objects.map((o) => ({ ...o, environmentId: targetId }));
    await Promise.all([
        saveEnvironment(targetEnv),
        targetObjects.length > 0 ? saveEnvObjects(targetObjects) : Promise.resolve(),
        vertices.length > 0 ? saveEnvVertices(vertices) : Promise.resolve(),
    ]);
    await loadWorkspace(targetId);
}
