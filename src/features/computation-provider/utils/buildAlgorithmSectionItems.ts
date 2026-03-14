import type { CardModalListPartItem } from "@/components/modals/card-modal/CardModal";
import type { ComputationAlgorithmDetails } from "@/types/serviceTypes";

const ALGORITHM_PARAMETER_COLUMNS = [
    { id: "parameter", title: "Parameter" },
    { id: "type", title: "Type" },
    { id: "values", title: "Values / Default" },
] as const;

interface BuildAlgorithmSectionItemsOptions {
    algorithmDetails: ComputationAlgorithmDetails[];
    expanded: Record<number, boolean>;
    isDraft: boolean;
    onToggle: (algorithmId: number) => void;
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
