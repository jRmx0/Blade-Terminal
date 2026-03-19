import type { Environment, EnvironmentComputation } from "@/types/schemaTypes";

export function createEmptyEnvironmentComputation(environmentId: number): EnvironmentComputation {
    return {
        environmentId,
        selectedProviderId: null,
        selectedAlgorithmId: null,
    };
}

export function normalizeEnvironmentComputation(
    computation: Partial<EnvironmentComputation> & { environmentId: number },
): EnvironmentComputation {
    return {
        environmentId: computation.environmentId,
        selectedProviderId: typeof computation.selectedProviderId === "number" ? computation.selectedProviderId : null,
        selectedAlgorithmId: typeof computation.selectedAlgorithmId === "number" ? computation.selectedAlgorithmId : null,
    };
}

export function normalizeEnvironment(env: Environment): Environment {
    return { ...env };
}
