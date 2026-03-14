import type { CardModalListPartItem } from "@/components/modals/card-modal/CardModal";
import type { AlgorithmParameter, ComputationAlgorithm, ComputationAlgorithmDetails } from "@/types/serviceTypes";

const ALGORITHM_PARAMETER_COLUMNS = [
    { id: "parameter", title: "Parameter" },
    { id: "type", title: "Type" },
    { id: "values", title: "Values / Default" },
] as const;

interface BuildSavedAlgorithmDetailsOptions {
    algorithms?: ComputationAlgorithm[];
    algorithmParameters?: AlgorithmParameter[];
}

interface BuildAlgorithmSectionItemsOptions {
    algorithmDetails: ComputationAlgorithmDetails[];
    expanded: Record<number, boolean>;
    isDraft: boolean;
    onToggle: (algorithmId: number) => void;
}

export function buildSavedAlgorithmDetails({
    algorithms,
    algorithmParameters,
}: BuildSavedAlgorithmDetailsOptions): ComputationAlgorithmDetails[] {
    if (!algorithms) {
        return [];
    }

    const parametersByAlgorithmId = new Map<number, AlgorithmParameter[]>();

    for (const parameter of algorithmParameters ?? []) {
        const existingParameters = parametersByAlgorithmId.get(parameter.algorithmId);

        if (existingParameters) {
            existingParameters.push(parameter);
            continue;
        }

        parametersByAlgorithmId.set(parameter.algorithmId, [parameter]);
    }

    return algorithms.map((algorithm) => ({
        algorithm,
        parameters: parametersByAlgorithmId.get(algorithm.id) ?? [],
    }));
}

export function buildAlgorithmSectionItems({
    algorithmDetails,
    expanded,
    isDraft,
    onToggle,
}: BuildAlgorithmSectionItemsOptions): CardModalListPartItem[] {
    return algorithmDetails.map(({ algorithm, parameters }) => ({
        id: isDraft ? `draft-${algorithm.id}-${algorithm.name}` : `${algorithm.id}-${algorithm.computationProviderId}`,
        title: algorithm.label,
        subtitle: algorithm.name,
        expanded: !!expanded[algorithm.id],
        onToggle: () => onToggle(algorithm.id),
        emptyMessage: "No parameters",
        columns: [...ALGORITHM_PARAMETER_COLUMNS],
        rows: parameters.map((parameter) => ({
            id: `${algorithm.id}-${parameter.id}-${parameter.name}`,
            cells: [
                {
                    value: parameter.label,
                    secondaryValue: parameter.name,
                    secondaryTone: "muted",
                    secondaryMono: true,
                },
                {
                    value: parameter.paramType,
                    mono: true,
                },
                parameter.enumValues.length > 0
                    ? {
                        value: parameter.enumValues.join(", "),
                    }
                    : parameter.defaultValue
                        ? {
                            value: `default: ${parameter.defaultValue}`,
                            tone: "muted",
                        }
                        : {
                            value: "—",
                            tone: "subtle",
                        },
            ],
        })),
    }));
}