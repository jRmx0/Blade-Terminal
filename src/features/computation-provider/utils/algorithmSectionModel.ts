import type { CardModalListPartColumn, CardModalListPartRow } from "@/components/modals/card-modal/CardModalListPart.types";
import type { AlgorithmParameter, ComputationAlgorithm, ComputationAlgorithmDetails, MetadataParamSection } from "@/types/serviceTypes";

const SECTION_ORDER: MetadataParamSection[] = [
    "General",
    "Coverage path",
    "Environment",
    "Object",
    "Execution",
];

export const ALGORITHM_PARAMETER_COLUMNS: CardModalListPartColumn[] = [
    { id: "label", title: "Name", width: 220 },
    { id: "type", title: "Type", width: 120 },
    { id: "defaultValue", title: "Default Value", width: 180 },
    { id: "enumValues", title: "Enum Values", width: 240 },
];

interface BuildSavedAlgorithmDetailsOptions {
    algorithms?: ComputationAlgorithm[];
    algorithmParameters?: AlgorithmParameter[];
}

interface BuildAlgorithmSectionRowsOptions {
    algorithmDetails: ComputationAlgorithmDetails[];
    isExpanded: (rowId: string, defaultExpanded?: boolean) => boolean;
    isDraft: boolean;
    onToggle: (rowId: string, defaultExpanded?: boolean) => void;
}

function getSectionRank(section: MetadataParamSection | undefined): number {
    if (!section) {
        return SECTION_ORDER.length;
    }

    const rank = SECTION_ORDER.indexOf(section);
    return rank === -1 ? SECTION_ORDER.length : rank;
}

function buildParameterRecordRow(algorithmId: number, parameter: AlgorithmParameter): CardModalListPartRow {
    return {
        kind: "record",
        id: `algorithm-${algorithmId}-parameter-${parameter.id}`,
        recordId: parameter.id,
        cells: {
            label: {
                value: parameter.label,
                title: parameter.label,
            },
            name: {
                value: parameter.name,
                title: parameter.name,
                mono: true,
                tone: "muted",
            },
            type: {
                value: parameter.paramType,
                mono: true,
            },
            defaultValue: parameter.defaultValue
                ? {
                    value: parameter.defaultValue,
                    title: parameter.defaultValue,
                }
                : {
                    value: "—",
                    tone: "subtle",
                },
            enumValues: parameter.enumValues.length > 0
                ? {
                    value: parameter.enumValues.join(", "),
                    title: parameter.enumValues.join(", "),
                }
                : {
                    value: "—",
                    tone: "subtle",
                },
        },
    };
}

function buildParameterRows(algorithmId: number, parameters: AlgorithmParameter[]) {
    const sortedParameters = [...parameters].sort((left, right) => {
        const sectionDiff = getSectionRank(left.section) - getSectionRank(right.section);
        if (sectionDiff !== 0) {
            return sectionDiff;
        }

        return left.label.localeCompare(right.label);
    });

    const rows: CardModalListPartRow[] = [];
    let currentSection: MetadataParamSection | undefined;
    let currentSectionRows: AlgorithmParameter[] = [];

    function pushCurrentSectionRows() {
        if (currentSectionRows.length === 0) {
            return;
        }

        if (currentSection) {
            rows.push({
                kind: "group",
                id: `algorithm-${algorithmId}-section-${currentSection}`,
                label: currentSection,
                expanded: true,
                onToggle: () => undefined,
                children: currentSectionRows.map((parameter) => buildParameterRecordRow(algorithmId, parameter)),
            });
        } else {
            rows.push(...currentSectionRows.map((parameter) => buildParameterRecordRow(algorithmId, parameter)));
        }

        currentSectionRows = [];
    }

    for (const parameter of sortedParameters) {
        if (parameter.section !== currentSection) {
            pushCurrentSectionRows();
            currentSection = parameter.section;
        }

        currentSectionRows.push(parameter);
    }

    pushCurrentSectionRows();

    return rows;
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

export function buildAlgorithmSectionRows({
    algorithmDetails,
    isExpanded,
    isDraft,
    onToggle,
}: BuildAlgorithmSectionRowsOptions): CardModalListPartRow[] {
    return algorithmDetails.map(({ algorithm, parameters }) => {
        const rowId = isDraft ? `draft-algorithm-${algorithm.id}-${algorithm.name}` : `algorithm-${algorithm.id}-${algorithm.computationProviderId}`;

        return {
            kind: "group",
            id: rowId,
            label: algorithm.label,
            expanded: isExpanded(rowId, true),
            onToggle: () => onToggle(rowId, true),
            children: buildParameterRows(algorithm.id, parameters).map((row) => {
                if (row.kind !== "group") {
                    return row;
                }

                const groupRowId = `${rowId}-${row.id}`;

                return {
                    ...row,
                    id: groupRowId,
                    expanded: isExpanded(groupRowId, true),
                    onToggle: () => onToggle(groupRowId, true),
                };
            }),
        };
    });
}
