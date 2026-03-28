import { create } from "zustand";
import { ENV_FORMAT, GLOBAL_TYPE, type EnvFormat, type GlobalType } from "@/config/db-ops/enums";
import type { Environment, ComputationSelection } from "@/types/schemaTypes";
import { getSaveMode } from "@/stores/saveModeStore";
import { saveEnvironment } from "@server/db/environments";
import { saveComputationSelection } from "@server/db/computationSelection";
import {
    createEmptyComputationSelection,
    normalizeEnvironment,
    normalizeComputationSelection,
} from "@/utils/computationSelection";

interface EnvState {
    env: Environment;
    computation: ComputationSelection;
    /** True when env metadata or computation selection has been changed since the last save or load. */
    isEnvDirty: boolean;
    /** Replaces the full environment record. Used by workspace bridge after load or init. Does not mark dirty. */
    setEnv: (env: Environment) => void;
    /** Replaces the computation selection. Used by workspace bridge after load or init. Does not mark dirty. */
    setComputation: (computation: ComputationSelection) => void;
    /** Updates the environment name and marks the record as dirty. Triggers autosave when mode is "autosave". */
    setName: (name: string) => void;
    /** Updates the environment format and marks the record as dirty. Triggers autosave when mode is "autosave". */
    setFormat: (format: EnvFormat) => void;
    /** Updates the environment global type and marks the record as dirty. Triggers autosave when mode is "autosave". */
    setType: (type: GlobalType) => void;
    /** Updates the active computation provider and clears the active algorithm selection. */
    setComputationProviderId: (providerId: number | null) => void;
    /** Updates the active computation algorithm within the selected provider. */
    setComputationAlgorithmId: (algorithmId: number | null) => void;
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

const INITIAL_COMPUTATION: ComputationSelection = createEmptyComputationSelection(0);

function autosave(env: Environment, computation: ComputationSelection): void {
    if (getSaveMode() === "autosave") {
        saveEnvironment(env).catch(console.error);
        saveComputationSelection(computation).catch(console.error);
    }
}

function markEnvDirty(set: (fn: (state: EnvState) => Partial<EnvState>) => void, updater: (env: Environment) => Environment): void {
    set((state) => {
        const env = updater(normalizeEnvironment(state.env));
        autosave(env, state.computation);
        return { env, isEnvDirty: true };
    });
}

export const useEnvStore = create<EnvState>()((set) => ({
    env: INITIAL_ENV,
    computation: INITIAL_COMPUTATION,
    isEnvDirty: false,

    setEnv: (env) => set({ env: normalizeEnvironment(env) }),

    setComputation: (computation) => set({ computation: normalizeComputationSelection(computation) }),

    setName: (name) => markEnvDirty(set, (env) => ({ ...env, name })),

    setFormat: (format) => markEnvDirty(set, (env) => ({ ...env, format })),

    setType: (type) => markEnvDirty(set, (env) => ({ ...env, type })),

    setComputationProviderId: (providerId) => {
        set((state) => {
            const computation = normalizeComputationSelection(state.computation);

            if (computation.selectedProviderId === providerId) {
                return {};
            }

            const nextComputation: ComputationSelection = {
                ...computation,
                selectedProviderId: providerId,
                selectedAlgorithmId: null,
            };

            autosave(state.env, nextComputation);
            return { computation: nextComputation, isEnvDirty: true };
        });
    },

    setComputationAlgorithmId: (algorithmId) => {
        set((state) => {
            const computation = normalizeComputationSelection(state.computation);

            if (computation.selectedAlgorithmId === algorithmId) {
                return {};
            }

            const nextComputation: ComputationSelection = {
                ...computation,
                selectedAlgorithmId: algorithmId,
            };

            autosave(state.env, nextComputation);
            return { computation: nextComputation, isEnvDirty: true };
        });
    },

    clearDirty: () => set({ isEnvDirty: false }),
}));
