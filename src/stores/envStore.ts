import { create } from "zustand";
import { ENV_FORMAT, OBJECT_TYPE } from "@/config/db-ops/enums";
import type { Environment } from "@/types/envTypes";
import { getSaveMode, useSaveModeStore } from "@/stores/saveModeStore";
import { saveEnvironment, getEnvironment, getNextEnvironmentId } from "@server/db/environments";
import { getMaxEnvObjectId } from "@server/db/env-objects";
import { getMaxEnvVertexId } from "@server/db/env-vertices";
import { useCanvasObjectStore, seedIdCounter } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasHistoryStore } from "@/features/canvas-editing/stores/canvasHistoryStore";

interface EnvState {
    env: Environment;
    /** True when env metadata has been changed since the last save or load. */
    isEnvDirty: boolean;
    /** Resolves the correct id from IndexedDB and sets it on the initial env. Call once at app startup. */
    init: () => Promise<void>;
    /** Resets to a fresh blank environment without saving. Used when the active env is deleted. */
    reset: () => Promise<void>;
    setName: (name: string) => void;
    incrementZoneCount: () => void;
    decrementZoneCount: () => void;
    incrementObstacleCount: () => void;
    decrementObstacleCount: () => void;
    /** Manual save: persists current env to IndexedDB. */
    save: () => Promise<void>;
    /** Loads env from IndexedDB and replaces in-memory state. */
    load: (id: number) => Promise<void>;
    /** Clears the env dirty flag. Called by useCanvasSave after a full save. */
    clearEnvDirty: () => void;
}

const INITIAL_ENV: Environment = {
    id: 0,
    name: "Untitled Environment",
    format: ENV_FORMAT.POLYGON,
    type: OBJECT_TYPE.OFFLINE,
    zoneObjectCount: 0,
    obstacleObjectCount: 0,
};

function autosave(env: Environment) {
    const mode = getSaveMode();
    if (mode === "autosave") {
        saveEnvironment(env).catch(console.error);
    }
}

export const useEnvStore = create<EnvState>((set, get) => ({
    env: INITIAL_ENV,
    isEnvDirty: false,

    init: async () => {
        const [id, maxObjId, maxVtxId] = await Promise.all([
            getNextEnvironmentId(),
            getMaxEnvObjectId(),
            getMaxEnvVertexId(),
        ]);
        seedIdCounter(Math.max(maxObjId, maxVtxId));
        set((state) => ({ env: { ...state.env, id } }));
    },

    reset: async () => {
        const [id, maxObjId, maxVtxId] = await Promise.all([
            getNextEnvironmentId(),
            getMaxEnvObjectId(),
            getMaxEnvVertexId(),
        ]);
        seedIdCounter(Math.max(maxObjId, maxVtxId));
        set({ env: { ...INITIAL_ENV, id }, isEnvDirty: false });
        useSaveModeStore.getState().setMode("session");
        useCanvasObjectStore.getState().clearAll();
        useCanvasHistoryStore.getState().resetHistory();
    },

    setName: (name) => {
        set((state) => {
            const env = { ...state.env, name };
            autosave(env);
            return { env, isEnvDirty: true };
        });
    },

    incrementZoneCount: () => {
        set((state) => {
            const env = { ...state.env, zoneObjectCount: state.env.zoneObjectCount + 1 };
            autosave(env);
            return { env, isEnvDirty: true };
        });
    },

    decrementZoneCount: () => {
        set((state) => {
            const env = { ...state.env, zoneObjectCount: Math.max(0, state.env.zoneObjectCount - 1) };
            autosave(env);
            return { env, isEnvDirty: true };
        });
    },

    incrementObstacleCount: () => {
        set((state) => {
            const env = { ...state.env, obstacleObjectCount: state.env.obstacleObjectCount + 1 };
            autosave(env);
            return { env, isEnvDirty: true };
        });
    },

    decrementObstacleCount: () => {
        set((state) => {
            const env = { ...state.env, obstacleObjectCount: Math.max(0, state.env.obstacleObjectCount - 1) };
            autosave(env);
            return { env, isEnvDirty: true };
        });
    },

    save: async () => {
        await saveEnvironment(get().env);
        set({ isEnvDirty: false });
    },

    load: async (id) => {
        const env = await getEnvironment(id);
        if (!env) return;
        set({ env, isEnvDirty: false });
        useSaveModeStore.getState().setMode("manual");
        await useCanvasObjectStore.getState().load(id);
        useCanvasHistoryStore.getState().resetHistory();
    },

    clearEnvDirty: () => set({ isEnvDirty: false }),
}));
