import type { Environment, EnvironmentComputationConfig } from "@/types/schemaTypes";

export function createEmptyEnvironmentComputationConfig(): EnvironmentComputationConfig {
    return {
        selectedProviderId: null,
        selectedAlgorithmId: null,
    };
}

export function normalizeEnvironmentComputationConfig(
    config?: Partial<EnvironmentComputationConfig> | null,
): EnvironmentComputationConfig {
    return {
        selectedProviderId: typeof config?.selectedProviderId === "number" ? config.selectedProviderId : null,
        selectedAlgorithmId: typeof config?.selectedAlgorithmId === "number" ? config.selectedAlgorithmId : null,
    };
}

export function normalizeEnvironment(env: Environment): Environment {
    return {
        ...env,
        computation: normalizeEnvironmentComputationConfig(env.computation),
    };
}
