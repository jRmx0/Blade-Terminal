import type { CardModalListPartColumn, CardModalListPartGroupRow, CardModalListPartRow } from "@/components/modals/card-modal/CardModalListPart.types";
import type { AlgorithmParameter, ComputationAlgorithm, ComputationAlgorithmDetails, MetadataParamSection } from "@/types/serviceTypes";

export const ALGORITHM_PARAMETER_COLUMNS: CardModalListPartColumn[] = [
    { id: "name", title: "Name", width: 220 },
    { id: "type", title: "Type", width: 120 },
    { id: "enumValues", title: "Enum Values", width: 240 },
    { id: "defaultValue", title: "Default Value", width: 180 },
    { id: "appHandler", title: "App Handler", width: 220 },
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

function normalizeSection(section: MetadataParamSection | undefined): MetadataParamSection {
    const trimmedSection = section?.trim();
    return trimmedSection ? trimmedSection : "General";
}

function buildParameterRecordRow(algorithmId: number, parameter: AlgorithmParameter): CardModalListPartRow {
    return {
        kind: "record",
        id: `algorithm-${algorithmId}-parameter-${parameter.id}`,
        recordId: parameter.id,
        cells: {
            name: {
                value: parameter.name,
                title: parameter.name,
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
            appHandler: parameter.appHandler
                ? {
                    value: parameter.appHandler,
                    title: parameter.appHandler,
                    mono: true,
                }
                : {
                    value: "—",
                    tone: "subtle",
                },
        },
    };
}

function buildParameterRows(algorithmId: number, parameters: AlgorithmParameter[]): CardModalListPartRow[] {
    const parametersBySection = new Map<MetadataParamSection, AlgorithmParameter[]>();

    for (const parameter of parameters) {
        const section = normalizeSection(parameter.section);
        const sectionParameters = parametersBySection.get(section);

        if (sectionParameters) {
            sectionParameters.push(parameter);
            continue;
        }

        parametersBySection.set(section, [parameter]);
    }

    return Array.from(parametersBySection.entries()).map(([section, sectionParameters]) => {
        const sectionRow: CardModalListPartGroupRow = {
            kind: "group",
            id: `algorithm-${algorithmId}-section-${section}`,
            label: section,
            expanded: true,
            onToggle: () => undefined,
            children: sectionParameters.map((parameter) => buildParameterRecordRow(algorithmId, parameter)),
        };

        return sectionRow;
    });
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
        layers: [],
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

        const children = buildParameterRows(algorithm.id, parameters).map((row): CardModalListPartRow => {
            if (row.kind !== "group") {
                return row;
            }

            const groupRowId = `${rowId}-${row.id}`;
            const nestedGroupRow: CardModalListPartGroupRow = {
                ...row,
                id: groupRowId,
                expanded: isExpanded(groupRowId, true),
                onToggle: () => onToggle(groupRowId, true),
            };

            return nestedGroupRow;
        });

        const algorithmRow: CardModalListPartGroupRow = {
            kind: "group",
            id: rowId,
            label: algorithm.name,
            expanded: isExpanded(rowId, true),
            onToggle: () => onToggle(rowId, true),
            children,
        };

        return algorithmRow;
    });
}
