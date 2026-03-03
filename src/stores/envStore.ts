import { create } from "zustand";
import { ENV_FORMAT, OBJECT_TYPE } from "@/config/db-ops/enums";
import type { Environment } from "@/types/envTypes";
import { getSaveMode } from "@/stores/saveModeStore";
import { saveEnvironment } from "@server/db/environments";

interface EnvState {
    env: Environment;
    /** True when env metadata has been changed since the last save or load. */
    isEnvDirty: boolean;
    /** Replaces the full environment record. Used by workspace bridge after load or init. Does not mark dirty. */
    setEnv: (env: Environment) => void;
    /** Updates the environment name and marks the record as dirty. Triggers autosave when mode is "autosave". */
    setName: (name: string) => void;
    /** Clears the dirty flag. Called by canvas bridge after a successful save. */
    clearDirty: () => void;
}

const INITIAL_ENV: Environment = {
    id: 0,
    name: "Untitled Environment",
    format: ENV_FORMAT.POLYGON,
    type: OBJECT_TYPE.OFFLINE,
    zoneObjectCount: 0,
    obstacleObjectCount: 0,
};

function autosaveEnv(env: Environment): void {
    if (getSaveMode() === "autosave") {
        saveEnvironment(env).catch(console.error);
    }
}

export const useEnvStore = create<EnvState>()((set) => ({
    env: INITIAL_ENV,
    isEnvDirty: false,

    setEnv: (env) => set({ env }),

    setName: (name) => {
        set((state) => {
            const env = { ...state.env, name };
            autosaveEnv(env);
            return { env, isEnvDirty: true };
        });
    },

    clearDirty: () => set({ isEnvDirty: false }),
}));
