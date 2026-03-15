import type { Environment, EnvironmentComputationConfig, EnvironmentComputationValueMap } from "@/types/schemaTypes";

export const EMPTY_ENVIRONMENT_COMPUTATION_CONFIG: EnvironmentComputationConfig = {
    selectedProviderId: null,
    selectedAlgorithmId: null,
    parameterValuesByTarget: {},
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function normalizeParameterValueMap(value: unknown): EnvironmentComputationValueMap {
    if (!isRecord(value)) return {};

    return Object.entries(value).reduce<EnvironmentComputationValueMap>((acc, [targetKey, rawParams]) => {
        if (!isRecord(rawParams)) {
            acc[targetKey] = {};
            return acc;
        }

        acc[targetKey] = Object.entries(rawParams).reduce<Record<string, string>>((paramAcc, [paramName, rawValue]) => {
            if (typeof rawValue === "string") {
                paramAcc[paramName] = rawValue;
            }

            return paramAcc;
        }, {});

        return acc;
    }, {});
}

export function createEmptyEnvironmentComputationConfig(): EnvironmentComputationConfig {
    return {
        selectedProviderId: null,
        selectedAlgorithmId: null,
        parameterValuesByTarget: {},
    };
}

export function normalizeEnvironmentComputationConfig(
    config?: Partial<EnvironmentComputationConfig> | null,
): EnvironmentComputationConfig {
    return {
        selectedProviderId: typeof config?.selectedProviderId === "number" ? config.selectedProviderId : null,
        selectedAlgorithmId: typeof config?.selectedAlgorithmId === "number" ? config.selectedAlgorithmId : null,
        parameterValuesByTarget: normalizeParameterValueMap(config?.parameterValuesByTarget),
    };
}

export function normalizeEnvironment(env: Environment): Environment {
    return {
        ...env,
        computation: normalizeEnvironmentComputationConfig(env.computation),
    };
}

export function buildEnvironmentComputationTargetKey(providerId: number, algorithmId: number): string {
    return `${providerId}:${algorithmId}`;
}

export function getEnvironmentComputationParameterValue(
    config: EnvironmentComputationConfig,
    providerId: number,
    algorithmId: number,
    parameterName: string,
): string | undefined {
    const targetKey = buildEnvironmentComputationTargetKey(providerId, algorithmId);
    return config.parameterValuesByTarget[targetKey]?.[parameterName];
}

export function setEnvironmentComputationParameterValue(
    config: EnvironmentComputationConfig,
    providerId: number,
    algorithmId: number,
    parameterName: string,
    value: string,
): EnvironmentComputationConfig {
    const targetKey = buildEnvironmentComputationTargetKey(providerId, algorithmId);
    const nextTargetValues = {
        ...(config.parameterValuesByTarget[targetKey] ?? {}),
        [parameterName]: value,
    };

    return {
        ...config,
        parameterValuesByTarget: {
            ...config.parameterValuesByTarget,
            [targetKey]: nextTargetValues,
        },
    };
}