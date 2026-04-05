import { getEnvironment, saveEnvironment } from "@server/db/environments";
import { getComputationSelection, saveComputationSelection } from "@server/db/computationSelection";
import { getAlgorithmParametersByEnvironment, saveAlgorithmParameters } from "@server/db/computationAlgorithmParameters";
import { deleteObjectsByEnvironment, saveObjects } from "@server/db/objects";
import { COORD_SYSTEM, ENV_FORMAT, ENV_TYPE, OBJECT_CATEGORY } from "@/config/db-ops/enums";
import type { Environment } from "@/types/schemaTypes";
import type { ImportedWorkspaceData } from "@/features/workspace-manager/utils/importWorkspace";
import { useEnvStore } from "@/stores/envStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasHistoryStore } from "@/features/canvas-editing/stores/canvasHistoryStore";
import { useSaveModeStore } from "@/stores/saveModeStore";
import { useParameterValuesStore } from "@/stores/parameterValuesStore";
import { loadComputationCatalog } from "@/stores/computationCatalogStore";
import { loadLayerSettings } from "@/stores/layerSettingsStore";
import { initLayerSettingsForEnvironment } from "@server/db/layerSettings";
import { getComputeResult } from "@server/db/computeResults";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import { resolveNextEnvironmentId, loadCanvasForEnvironment, saveCanvas } from "@/features/canvas-editing/data/canvasBridge";
import { createEmptyComputationSelection } from "@/utils/computationSelection";

const BLANK_ENV: Omit<Environment, "id"> = {
    name: "Untitled Environment",
    format: ENV_FORMAT.POLYGON,
    type: ENV_TYPE.ANY_OFFLINE,
    coordSystem: COORD_SYSTEM.DECIMAL,
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
    useEnvStore.getState().setComputation(createEmptyComputationSelection(nextId));
    useParameterValuesStore.getState().setParameterValues([]);
    await loadComputationCatalog();
    await initLayerSettingsForEnvironment(nextId);
    await loadLayerSettings(nextId);
    useComputeResultStore.getState().clearResult();
}

/** Discards the current environment and starts a blank one without saving. */
export async function resetWorkspace(): Promise<void> {
    const nextId = await resolveNextEnvironmentId();
    const env = { ...BLANK_ENV, id: nextId };
    useEnvStore.getState().setEnv(env);
    useEnvStore.getState().setComputation(createEmptyComputationSelection(nextId));
    useEnvStore.getState().clearDirty();
    useParameterValuesStore.getState().setParameterValues([]);
    useSaveModeStore.getState().setMode("session");
    useCanvasObjectStore.getState().setObjects([]);
    useCanvasHistoryStore.getState().resetHistory();
    await initLayerSettingsForEnvironment(nextId);
    await loadLayerSettings(nextId);
    useComputeResultStore.getState().clearResult();
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
    useEnvStore.getState().clearDirty();
    const [computation, parameterValues] = await Promise.all([
        getComputationSelection(environmentId),
        getAlgorithmParametersByEnvironment(environmentId),
    ]);
    // Set parameter values before computation so the panel's init effect sees loaded values
    // when it fires in response to the algorithm/provider selection being restored.
    useParameterValuesStore.getState().setParameterValues(parameterValues);
    useEnvStore.getState().setComputation(computation);
    useCanvasHistoryStore.getState().resetHistory();
    await loadLayerSettings(environmentId);
    const existingResult = await getComputeResult(environmentId);
    if (existingResult) {
        useComputeResultStore.getState().setResult(existingResult);
    } else {
        useComputeResultStore.getState().clearResult();
    }
}

/** Saves the current canvas as a new environment or overwrites an existing one, then loads it. */
export async function saveAsWorkspace(name: string, selectedEnvId: number | null): Promise<void> {
    const { env, computation } = useEnvStore.getState();
    const { objects } = useCanvasObjectStore.getState();
    const targetId = selectedEnvId ?? (await resolveNextEnvironmentId());
    const targetEnv: Environment = { ...env, id: targetId, name };
    if (selectedEnvId !== null) {
        await deleteObjectsByEnvironment(targetEnv);
    }
    const targetObjects = objects.map((o) => ({ ...o, environmentId: targetId }));
    const { parameterValues } = useParameterValuesStore.getState();
    const targetParamValues = parameterValues.map((pv) => ({ ...pv, environmentId: targetId }));
    await Promise.all([
        saveEnvironment(targetEnv),
        saveComputationSelection({ ...computation, environmentId: targetId }),
        targetParamValues.length > 0 ? saveAlgorithmParameters(targetParamValues) : Promise.resolve(),
        targetObjects.length > 0 ? saveObjects(targetObjects) : Promise.resolve(),
        selectedEnvId === null ? initLayerSettingsForEnvironment(targetId) : Promise.resolve(),
    ]);
    await loadWorkspace(targetId);
}

/**
 * Copies the current in-memory workspace to a new environment in IndexedDB without switching the
 * active workspace. Returns the newly created environment ID so the caller can offer to load it.
 */
export async function copyWorkspace(name: string): Promise<number> {
    const { env, computation } = useEnvStore.getState();
    const { objects } = useCanvasObjectStore.getState();
    const { parameterValues } = useParameterValuesStore.getState();
    const targetId = await resolveNextEnvironmentId();
    const targetEnv: Environment = { ...env, id: targetId, name };
    const targetObjects = objects.map((o) => ({ ...o, environmentId: targetId }));
    const targetParamValues = parameterValues.map((pv) => ({ ...pv, environmentId: targetId }));
    await Promise.all([
        saveEnvironment(targetEnv),
        saveComputationSelection({ ...computation, environmentId: targetId }),
        targetParamValues.length > 0 ? saveAlgorithmParameters(targetParamValues) : Promise.resolve(),
        targetObjects.length > 0 ? saveObjects(targetObjects) : Promise.resolve(),
        initLayerSettingsForEnvironment(targetId),
    ]);
    return targetId;
}

/**
 * Imports a parsed workspace from an XML file into a new environment in IndexedDB, then loads it.
 * Parameter values and computation selection are reset to empty (they are not part of the export format).
 */
export async function importWorkspace(data: ImportedWorkspaceData): Promise<void> {
    const targetId = await resolveNextEnvironmentId();

    const zoneCount = countByCategory(data.objects, OBJECT_CATEGORY.ZONE);
    const obstacleCount = countByCategory(data.objects, OBJECT_CATEGORY.OBSTACLE);

    const targetEnv: Environment = {
        id: targetId,
        name: data.name,
        format: data.format,
        type: data.type,
        coordSystem: data.coordSystem,
        zoneCount,
        obstacleCount,
    };

    const targetObjects = data.objects.map((o, i) => ({
        id: o.id > 0 ? o.id : i + 1,
        environmentId: targetId,
        category: o.category,
        type: o.type,
        vertexCount: o.vertices.length,
        area: 0,
        vertices: o.vertices,
    }));

    await Promise.all([
        saveEnvironment(targetEnv),
        saveComputationSelection(createEmptyComputationSelection(targetId)),
        targetObjects.length > 0 ? saveObjects(targetObjects) : Promise.resolve(),
        initLayerSettingsForEnvironment(targetId),
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
