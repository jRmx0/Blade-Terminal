import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import ControlsPanelSection from "@/components/controls-panel/ControlsPanelSection";
import ControlsPanelSectionCheckbox from "@/components/controls-panel/ControlsPanelSectionCheckbox";
import ControlsPanelSectionInput from "@/components/controls-panel/ControlsPanelSectionInput";
import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import { APP_PARAMETER_HANDLER } from "@/config/computation/appParameterHandlers";
import CoordinateSystemSelect from "@/features/coverage-planning/components/controls-panel/env-section/CoordinateSystemSelect";
import FormatSelection from "@/features/coverage-planning/components/controls-panel/env-section/FormatSelect";
import GlobalTypeSelection from "@/features/coverage-planning/components/controls-panel/env-section/GlobalTypeSelect";
import { getAllComputationProviders } from "@server/db/computationProviders";
import { getAlgorithmsByProvider } from "@server/db/computationAlgorithms";
import { getParametersByAlgorithm } from "@server/db/algorithmParameters";
import { getAllAppEnums } from "@server/db/appEnums";
import { useEnvStore } from "@/stores/envStore";
import type { AlgorithmParameter, AppEnumValue } from "@/types/serviceTypes";
import { getEnvironmentComputationParameterValue } from "@/utils/environmentComputation";

interface ParameterSectionGroup {
    title: string;
    parameters: AlgorithmParameter[];
}

function normalizeSectionTitle(section?: string): string {
    const title = section?.trim();
    return title ? title : "General";
}

function parseBooleanParameterValue(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
}

function buildEnumOptionsFromValues(values: string[]): Array<{ value: string; label: string }> {
    return [{ value: "", label: "" }, ...values.map((value) => ({ value, label: value }))];
}

function groupParametersBySection(parameters: AlgorithmParameter[]): ParameterSectionGroup[] {
    const groupedSections = new Map<string, AlgorithmParameter[]>();

    parameters.forEach((parameter) => {
        const sectionTitle = normalizeSectionTitle(parameter.section);
        const sectionParameters = groupedSections.get(sectionTitle);

        if (sectionParameters) {
            sectionParameters.push(parameter);
            return;
        }

        groupedSections.set(sectionTitle, [parameter]);
    });

    return Array.from(groupedSections.entries()).map(([title, sectionParameters]) => ({
        title,
        parameters: sectionParameters,
    }));
}

function getParameterDisplayValue(
    parameter: AlgorithmParameter,
    selectedProviderId: number,
    selectedAlgorithmId: number,
    parameterValuesByTarget: Record<string, Record<string, string>>,
): string {
    const persistedValue = getEnvironmentComputationParameterValue(
        {
            selectedProviderId,
            selectedAlgorithmId,
            parameterValuesByTarget,
        },
        selectedProviderId,
        selectedAlgorithmId,
        parameter.name,
    );

    return persistedValue ?? parameter.defaultValue ?? "";
}

interface DynamicParameterFieldProps {
    parameter: AlgorithmParameter;
    selectedProviderId: number;
    selectedAlgorithmId: number;
    parameterValuesByTarget: Record<string, Record<string, string>>;
    appEnums: AppEnumValue[];
    onChange: (parameterName: string, value: string) => void;
}

function DynamicParameterField({
    parameter,
    selectedProviderId,
    selectedAlgorithmId,
    parameterValuesByTarget,
    appEnums,
    onChange,
}: DynamicParameterFieldProps) {
    const value = getParameterDisplayValue(parameter, selectedProviderId, selectedAlgorithmId, parameterValuesByTarget);

    switch (parameter.appHandler) {
        case APP_PARAMETER_HANDLER.ENVIRONMENT_COORDSYSTEM:
            return (
                <CoordinateSystemSelect
                    parameter={parameter}
                    appEnums={appEnums}
                />
            );

        case APP_PARAMETER_HANDLER.ENVIRONMENT_FORMAT:
            return (
                <FormatSelection
                    providerId={selectedProviderId}
                    algorithmId={selectedAlgorithmId}
                    parameterName={parameter.name}
                />
            );

        case APP_PARAMETER_HANDLER.ENVIRONMENT_TYPE:
            return (
                <GlobalTypeSelection
                    providerId={selectedProviderId}
                    algorithmId={selectedAlgorithmId}
                    parameterName={parameter.name}
                />
            );
    }

    switch (parameter.paramType) {
        case "Boolean":
            return (
                <ControlsPanelSectionCheckbox
                    label={parameter.name}
                    checked={parseBooleanParameterValue(value)}
                    onChange={(checked) => onChange(parameter.name, String(checked))}
                />
            );

        case "Enum":
            return (
                <ControlsPanelSectionSelect
                    label={parameter.name}
                    value={value}
                    onChange={(nextValue) => onChange(parameter.name, nextValue)}
                    options={buildEnumOptionsFromValues(parameter.enumValues)}
                />
            );

        case "Integer":
            return (
                <ControlsPanelSectionInput
                    label={parameter.name}
                    value={value}
                    onChange={(nextValue) => onChange(parameter.name, nextValue)}
                    type="number"
                />
            );

        case "Decimal":
            return (
                <ControlsPanelSectionInput
                    label={parameter.name}
                    value={value}
                    onChange={(nextValue) => onChange(parameter.name, nextValue)}
                    type="number"
                />
            );

        case "String":
        default:
            return (
                <ControlsPanelSectionInput
                    label={parameter.name}
                    value={value}
                    onChange={(nextValue) => onChange(parameter.name, nextValue)}
                />
            );
    }
}

export default function CoveragePlanningControlsPanel() {
    const computation = useEnvStore((state) => state.env.computation);
    const setComputationProviderId = useEnvStore((state) => state.setComputationProviderId);
    const setComputationAlgorithmId = useEnvStore((state) => state.setComputationAlgorithmId);
    const setComputationParameterValue = useEnvStore((state) => state.setComputationParameterValue);

    const providers = useLiveQuery(() => getAllComputationProviders(), []);
    const algorithms = useLiveQuery(
        () => (computation.selectedProviderId === null ? Promise.resolve([]) : getAlgorithmsByProvider(computation.selectedProviderId)),
        [computation.selectedProviderId],
    );
    const parameters = useLiveQuery(
        () => {
            if (computation.selectedProviderId === null || computation.selectedAlgorithmId === null) {
                return Promise.resolve([]);
            }

            return getParametersByAlgorithm(computation.selectedAlgorithmId, computation.selectedProviderId);
        },
        [computation.selectedProviderId, computation.selectedAlgorithmId],
    );
    const appEnums = useLiveQuery(() => getAllAppEnums(), []);

    useEffect(() => {
        if (providers === undefined) return;
        if (computation.selectedProviderId === null) return;

        const providerExists = providers.some((provider) => provider.id === computation.selectedProviderId);
        if (!providerExists) {
            setComputationProviderId(null);
        }
    }, [providers, computation.selectedProviderId, setComputationProviderId]);

    useEffect(() => {
        if (algorithms === undefined) return;
        if (computation.selectedAlgorithmId === null) return;

        const algorithmExists = algorithms.some((algorithm) => algorithm.id === computation.selectedAlgorithmId);
        if (!algorithmExists) {
            setComputationAlgorithmId(null);
        }
    }, [algorithms, computation.selectedAlgorithmId, setComputationAlgorithmId]);

    const providerOptions = useMemo(
        () => [
            { value: "", label: "" },
            ...(providers ?? [])
                .filter((provider): provider is typeof provider & { id: number } => provider.id !== undefined)
                .map((provider) => ({
                    value: String(provider.id),
                    label: provider.name,
                })),
        ],
        [providers],
    );

    const algorithmOptions = useMemo(
        () => [
            { value: "", label: "" },
            ...(algorithms ?? []).map((algorithm) => ({
                value: String(algorithm.id),
                label: algorithm.name,
            })),
        ],
        [algorithms],
    );

    const parameterSections = useMemo(() => groupParametersBySection(parameters ?? []), [parameters]);

    const selectedProviderValue = computation.selectedProviderId === null ? "" : String(computation.selectedProviderId);
    const selectedAlgorithmValue = computation.selectedAlgorithmId === null ? "" : String(computation.selectedAlgorithmId);
    const resolvedAppEnums = appEnums ?? [];

    return (
        <div>
            <ControlsPanelSection sectionId="computation-provider" title="Computation Provider">
                <ControlsPanelSectionSelect
                    label="Provider"
                    value={selectedProviderValue}
                    onChange={(value) => setComputationProviderId(value === "" ? null : Number(value))}
                    options={providerOptions}
                    disabled={(providers?.length ?? 0) === 0}
                />

                <ControlsPanelSectionSelect
                    label="Algorithm"
                    value={selectedAlgorithmValue}
                    onChange={(value) => setComputationAlgorithmId(value === "" ? null : Number(value))}
                    options={algorithmOptions}
                    disabled={computation.selectedProviderId === null || (algorithms?.length ?? 0) === 0}
                />
            </ControlsPanelSection>

            {computation.selectedProviderId !== null && computation.selectedAlgorithmId !== null && parameterSections.map((section) => (
                <ControlsPanelSection
                    key={section.title}
                    sectionId={`parameter-section:${section.title}`}
                    title={section.title}
                >
                    {section.parameters.map((parameter) => (
                        <DynamicParameterField
                            key={`${parameter.algorithmId}:${parameter.id}:${parameter.name}`}
                            parameter={parameter}
                            selectedProviderId={computation.selectedProviderId!}
                            selectedAlgorithmId={computation.selectedAlgorithmId!}
                            parameterValuesByTarget={computation.parameterValuesByTarget}
                            appEnums={resolvedAppEnums}
                            onChange={(parameterName, value) => {
                                setComputationParameterValue(
                                    computation.selectedProviderId!,
                                    computation.selectedAlgorithmId!,
                                    parameterName,
                                    value,
                                );
                            }}
                        />
                    ))}
                </ControlsPanelSection>
            ))}
        </div>
    );
}