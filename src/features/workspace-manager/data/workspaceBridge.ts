import { getEnvironment, saveEnvironment } from "@server/db/environments";
import { getEnvironmentComputation, saveEnvironmentComputation } from "@server/db/environmentComputation";
import { getAllParameterValuesByEnvironment, saveParameterValues } from "@server/db/environmentComputationParameterValues";
import { deleteObjectsByEnvironment, saveObjects } from "@server/db/objects";
import { saveVertices } from "@server/db/vertices";
import { ENV_FORMAT, GLOBAL_TYPE, OBJECT_CATEGORY } from "@/config/db-ops/enums";
import type { Environment } from "@/types/schemaTypes";
import { useEnvStore } from "@/stores/envStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasHistoryStore } from "@/features/canvas-editing/stores/canvasHistoryStore";
import { useSaveModeStore } from "@/stores/saveModeStore";
import { useParameterValuesStore } from "@/stores/parameterValuesStore";
import { loadComputationCatalog } from "@/stores/computationCatalogStore";
import { resolveNextEnvironmentId, loadCanvasForEnvironment, saveCanvas } from "@/features/canvas-editing/data/canvasBridge";
import { createEmptyEnvironmentComputation } from "@/utils/environmentComputation";

const BLANK_ENV: Omit<Environment, "id"> = {
    name: "Untitled Environment",
    format: ENV_FORMAT.POLYGON,
    type: GLOBAL_TYPE.OFFLINE,
    zoneCount: 0,
    obstacleCount: 0,
};

function countByCategory(objects: { category: string }[], category: string): number {
    return objects.filter((o) => o.category === category).length;
}

function modeAfterFirstSave(): "manual" | "autosave" {
    return useSaveModeStore.getState().isAutoSaveEnabled ? "autosave" : "manual";
}

/** Initializes a fresh blank environment at app startup. Seeds the ID counter from IndexedDB. */
export async function initializeWorkspace(): Promise<void> {
    const nextId = await resolveNextEnvironmentId();
    const env = { ...BLANK_ENV, id: nextId };
    useEnvStore.getState().setEnv(env);
    useEnvStore.getState().setComputation(createEmptyEnvironmentComputation(nextId));
    useParameterValuesStore.getState().setParameterValues([]);
    await loadComputationCatalog();
}

/** Discards the current environment and starts a blank one without saving. */
export async function resetWorkspace(): Promise<void> {
    const nextId = await resolveNextEnvironmentId();
    const env = { ...BLANK_ENV, id: nextId };
    useEnvStore.getState().setEnv(env);
    useEnvStore.getState().setComputation(createEmptyEnvironmentComputation(nextId));
    useEnvStore.getState().clearDirty();
    useParameterValuesStore.getState().setParameterValues([]);
    useSaveModeStore.getState().setMode("session");
    useCanvasObjectStore.getState().setObjects([], []);
    useCanvasHistoryStore.getState().resetHistory();
}

/** Loads an existing environment and its canvas objects from IndexedDB. */
export async function loadWorkspace(environmentId: number): Promise<void> {
    const env = await getEnvironment(environmentId);
    if (!env) return;
    useSaveModeStore.getState().setMode(modeAfterFirstSave());
    await loadCanvasForEnvironment(env);
    const { objects } = useCanvasObjectStore.getState();
    const zoneObjectCount = countByCategory(objects, OBJECT_CATEGORY.ZONE);
    const obstacleObjectCount = countByCategory(objects, OBJECT_CATEGORY.OBSTACLE);
    useEnvStore.getState().setEnv({ ...env, zoneCount: zoneObjectCount, obstacleCount: obstacleObjectCount });
    const computation = await getEnvironmentComputation(environmentId);
    useEnvStore.getState().setComputation(computation);
    const parameterValues = await getAllParameterValuesByEnvironment(environmentId);
    useParameterValuesStore.getState().setParameterValues(parameterValues);
    useCanvasHistoryStore.getState().resetHistory();
}

/** Saves the current canvas as a new environment or overwrites an existing one, then loads it. */
export async function saveAsWorkspace(name: string, selectedEnvId: number | null): Promise<void> {
    const { env, computation } = useEnvStore.getState();
    const { objects, vertices } = useCanvasObjectStore.getState();
    const targetId = selectedEnvId ?? (await resolveNextEnvironmentId());
    const targetEnv: Environment = { ...env, id: targetId, name };
    if (selectedEnvId !== null) {
        await deleteObjectsByEnvironment(targetEnv);
    }
    const targetObjects = objects.map((o) => ({ ...o, environmentId: targetId }));
    const targetVertices = vertices.map((v) => ({ ...v, environmentId: targetId }));
    const { parameterValues } = useParameterValuesStore.getState();
    const targetParamValues = parameterValues.map((pv) => ({ ...pv, environmentId: targetId }));
    await Promise.all([
        saveEnvironment(targetEnv),
        saveEnvironmentComputation({ ...computation, environmentId: targetId }),
        targetParamValues.length > 0 ? saveParameterValues(targetParamValues) : Promise.resolve(),
        targetObjects.length > 0 ? saveObjects(targetObjects) : Promise.resolve(),
        targetVertices.length > 0 ? saveVertices(targetVertices) : Promise.resolve(),
    ]);
    await loadWorkspace(targetId);
}

/**
 * Applies an autosave toggle to the current save mode:
 * - Enabling while mode is "manual" → switches to "autosave" and immediately saves any dirty state.
 * - Enabling while mode is "session" → no mode change; autosave activates on the next manual save.
 * - Disabling while mode is "autosave" → switches to "manual".
 */
export async function applyAutoSaveToggle(enabled: boolean): Promise<void> {
    const { mode, setMode } = useSaveModeStore.getState();
    if (enabled && mode === "manual") {
        setMode("autosave");
        await saveCanvas();
    } else if (!enabled && mode === "autosave") {
        setMode("manual");
    }
}
