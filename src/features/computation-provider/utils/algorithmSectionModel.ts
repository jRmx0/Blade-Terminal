import type { CardModalListPartItem } from "@/components/modals/card-modal/CardModal";
import type { AlgorithmParameter, ComputationAlgorithm, ComputationAlgorithmDetails, MetadataParamSection } from "@/types/serviceTypes";

const SECTION_ORDER: MetadataParamSection[] = [
    "General",
    "Coverage path",
    "Environment",
    "Object",
    "Execution",
];

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

function getSectionRank(section: MetadataParamSection | undefined): number {
    if (!section) {
        return SECTION_ORDER.length;
    }

    const rank = SECTION_ORDER.indexOf(section);
    return rank === -1 ? SECTION_ORDER.length : rank;
}

function buildParameterRows(algorithmId: number, parameters: AlgorithmParameter[]) {
    const sortedParameters = [...parameters].sort((left, right) => {
        const sectionDiff = getSectionRank(left.section) - getSectionRank(right.section);
        if (sectionDiff !== 0) {
            return sectionDiff;
        }

        return left.label.localeCompare(right.label);
    });

    const rows: CardModalListPartItem["rows"] = [];
    let currentSection: MetadataParamSection | null = null;

    for (const parameter of sortedParameters) {
        if (parameter.section && parameter.section !== currentSection) {
            currentSection = parameter.section;
            rows?.push({
                id: `${algorithmId}-${currentSection}-section`,
                variant: "section",
                sectionTitle: currentSection,
                cells: [],
            });
        } else if (!parameter.section) {
            currentSection = null;
        }

        rows?.push({
            id: `${algorithmId}-${parameter.id}-${parameter.name}`,
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
        });
    }

    return rows ?? [];
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
        rows: buildParameterRows(algorithm.id, parameters),
    }));
}