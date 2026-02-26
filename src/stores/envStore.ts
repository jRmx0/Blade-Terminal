import { create } from "zustand";
import { ENV_FORMAT, OBJECT_TYPE } from "@/config/enums";
import type { Environment } from "@/types/envTypes";
import { getSaveMode } from "@/stores/saveModeStore";
import { saveEnvironment, getEnvironment } from "@server/db/environments";

interface EnvState {
    env: Environment;
    setName: (name: string) => void;
    incrementZoneCount: () => void;
    decrementZoneCount: () => void;
    incrementObstacleCount: () => void;
    decrementObstacleCount: () => void;
    /** Manual save: persists current env to IndexedDB. */
    save: () => Promise<void>;
    /** Loads env from IndexedDB and replaces in-memory state. */
    load: (id: string) => Promise<void>;
}

const INITIAL_ENV: Environment = {
    id: "env-1",
    name: "Default Environment",
    format: ENV_FORMAT.POLYGON,
    type: OBJECT_TYPE.OFFLINE,
    zoneObjectCount: 0,
    obstacleObjectCount: 0,
};

function autosave(env: Environment) {
    if (getSaveMode() === "autosave") {
        saveEnvironment(env).catch(console.error);
    }
}

export const useEnvStore = create<EnvState>((set, get) => ({
    env: INITIAL_ENV,

    setName: (name) => {
        set((state) => {
            const env = { ...state.env, name };
            autosave(env);
            return { env };
        });
    },

    incrementZoneCount: () => {
        set((state) => {
            const env = { ...state.env, zoneObjectCount: state.env.zoneObjectCount + 1 };
            autosave(env);
            return { env };
        });
    },

    decrementZoneCount: () => {
        set((state) => {
            const env = { ...state.env, zoneObjectCount: Math.max(0, state.env.zoneObjectCount - 1) };
            autosave(env);
            return { env };
        });
    },

    incrementObstacleCount: () => {
        set((state) => {
            const env = { ...state.env, obstacleObjectCount: state.env.obstacleObjectCount + 1 };
            autosave(env);
            return { env };
        });
    },

    decrementObstacleCount: () => {
        set((state) => {
            const env = { ...state.env, obstacleObjectCount: Math.max(0, state.env.obstacleObjectCount - 1) };
            autosave(env);
            return { env };
        });
    },

    save: async () => {
        await saveEnvironment(get().env);
    },

    load: async (id) => {
        const env = await getEnvironment(id);
        if (env) set({ env });
    },
}));
