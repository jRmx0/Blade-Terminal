import { create } from "zustand";
import { ENV_FORMAT, GLOBAL_TYPE, type EnvFormat, type GlobalType } from "@/config/db-ops/enums";
import type { Environment } from "@/types/schemaTypes";
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
    /** Updates the environment format and marks the record as dirty. Triggers autosave when mode is "autosave". */
    setFormat: (format: EnvFormat) => void;
    /** Updates the environment global type and marks the record as dirty. Triggers autosave when mode is "autosave". */
    setType: (type: GlobalType) => void;
    /** Clears the dirty flag. Called by canvas bridge after a successful save. */
    clearDirty: () => void;
}

const INITIAL_ENV: Environment = {
    id: 0,
    name: "Untitled Environment",
    format: ENV_FORMAT.POLYGON,
    type: GLOBAL_TYPE.OFFLINE,
    zoneCount: 0,
    obstacleCount: 0,
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

    setFormat: (format) => {
        set((state) => {
            const env = { ...state.env, format };
            autosaveEnv(env);
            return { env, isEnvDirty: true };
        });
    },

    setType: (type) => {
        set((state) => {
            const env = { ...state.env, type };
            autosaveEnv(env);
            return { env, isEnvDirty: true };
        });
    },

    clearDirty: () => set({ isEnvDirty: false }),
}));
