import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import ControlsPanelSection from "@/components/controls-panel/ControlsPanelSection";
import ControlsPanelSeparator from "@/components/controls-panel/ControlsPanelSeparator";
import ControlsPanelSectionCheckbox from "@/components/controls-panel/ControlsPanelSectionCheckbox";
import ControlsPanelSectionInput from "@/components/controls-panel/ControlsPanelSectionInput";
import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import { APP_PARAMETER_HANDLER } from "@/config/computation/appParameterHandlers";
import {
    ENV_FORMAT_OPTIONS,
    GLOBAL_TYPE_OPTIONS,
    defaultObjectTypeForGlobal,
    isGlobalTypeFixed,
    type EnvFormat,
    type GlobalType,
} from "@/config/db-ops/enums";
import CoordinateSystemSelect from "@/features/coverage-planning/components/controls-panel/env-section/CoordinateSystemSelect";
import FormatSelection from "@/features/coverage-planning/components/controls-panel/env-section/FormatSelect";
import GlobalTypeSelection from "@/features/coverage-planning/components/controls-panel/env-section/GlobalTypeSelect";
import { getAllAppEnums } from "@server/db/appEnums";
import { useEnvStore } from "@/stores/envStore";
import { useParameterValuesStore } from "@/stores/parameterValuesStore";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useConfirmationModalStore } from "@/stores/confirmationModalStore";
import type { AlgorithmParameter, AppEnumValue } from "@/types/serviceTypes";
import type { EnvironmentComputationParameterValue } from "@/types/schemaTypes";

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
    parameterValues: EnvironmentComputationParameterValue[],
): string {
    const persistedValue = parameterValues.find((pv) => pv.id === parameter.id)?.value;
    return persistedValue ?? parameter.defaultValue ?? "";
}

interface DynamicParameterFieldProps {
    parameter: AlgorithmParameter;
    selectedProviderId: number;
    selectedAlgorithmId: number;
    parameterValues: EnvironmentComputationParameterValue[];
    appEnums: AppEnumValue[];
    onChange: (parameterId: number, value: string) => void;
}

function DynamicParameterField({
    parameter,
    selectedProviderId,
    selectedAlgorithmId,
    parameterValues,
    appEnums,
    onChange,
}: DynamicParameterFieldProps) {
    const value = getParameterDisplayValue(parameter, parameterValues);

    switch (parameter.appHandler) {
        case APP_PARAMETER_HANDLER.ENVIRONMENT_COORDSYSTEM:
            return (
                <CoordinateSystemSelect
                    parameter={parameter} currentValue={value} appEnums={appEnums}
                />
            );

        case APP_PARAMETER_HANDLER.ENVIRONMENT_FORMAT:
            return (
                <FormatSelection
                    providerId={selectedProviderId}
                    algorithmId={selectedAlgorithmId}
                    parameterId={parameter.id}
                    parameterName={parameter.name}
                    enumValues={parameter.enumValues}
                />
            );

        case APP_PARAMETER_HANDLER.ENVIRONMENT_TYPE:
            return (
                <GlobalTypeSelection
                    providerId={selectedProviderId}
                    algorithmId={selectedAlgorithmId}
                    parameterId={parameter.id}
                    parameterName={parameter.name}
                    enumValues={parameter.enumValues}
                />
            );
    }

    switch (parameter.paramType) {
        case "Boolean":
            return (
                <ControlsPanelSectionCheckbox
                    label={parameter.name}
                    checked={parseBooleanParameterValue(value)}
                    onChange={(checked) => onChange(parameter.id, String(checked))}
                />
            );

        case "Enum":
            return (
                <ControlsPanelSectionSelect
                    label={parameter.name}
                    value={value}
                    onChange={(nextValue) => onChange(parameter.id, nextValue)}
                    options={buildEnumOptionsFromValues(parameter.enumValues)}
                />
            );

        case "Integer":
            return (
                <ControlsPanelSectionInput
                    label={parameter.name}
                    value={value}
                    onChange={(nextValue) => onChange(parameter.id, nextValue)}
                    type="number"
                />
            );

        case "Decimal":
            return (
                <ControlsPanelSectionInput
                    label={parameter.name}
                    value={value}
                    onChange={(nextValue) => onChange(parameter.id, nextValue)}
                    type="number"
                />
            );

        case "String":
        default:
            return (
                <ControlsPanelSectionInput
                    label={parameter.name}
                    value={value}
                    onChange={(nextValue) => onChange(parameter.id, nextValue)}
                />
            );
    }
}

export default function CoveragePlanningControlsPanel() {
    const computation = useEnvStore((state) => state.computation);
    const envId = useEnvStore((state) => state.env.id);
    const setComputationProviderId = useEnvStore((state) => state.setComputationProviderId);
    const setComputationAlgorithmId = useEnvStore((state) => state.setComputationAlgorithmId);

    const allParameterValues = useParameterValuesStore((state) => state.parameterValues);
    const setParameterValueInStore = useParameterValuesStore((state) => state.setParameterValue);

    const parameterValues = useMemo(() => {
        if (computation.selectedProviderId === null || computation.selectedAlgorithmId === null) return [];
        return allParameterValues.filter(
            (pv) => pv.algorithmId === computation.selectedAlgorithmId && pv.providerId === computation.selectedProviderId,
        );
    }, [allParameterValues, computation.selectedAlgorithmId, computation.selectedProviderId]);

    const allProviders = useComputationCatalogStore((s) => s.providers);
    const allAlgorithms = useComputationCatalogStore((s) => s.algorithms);
    const allParameters = useComputationCatalogStore((s) => s.parameters);
    const appEnums = useLiveQuery(() => getAllAppEnums(), []);

    const providers = allProviders;
    const algorithms = useMemo(
        () => (computation.selectedProviderId === null
            ? []
            : allAlgorithms.filter((a) => a.computationProviderId === computation.selectedProviderId)),
        [allAlgorithms, computation.selectedProviderId],
    );
    const parameters = useMemo(
        () => {
            if (computation.selectedProviderId === null || computation.selectedAlgorithmId === null) return [];
            return allParameters.filter(
                (p) => p.computationProviderId === computation.selectedProviderId
                    && p.algorithmId === computation.selectedAlgorithmId,
            );
        },
        [allParameters, computation.selectedProviderId, computation.selectedAlgorithmId],
    );

    // Validate format/type constraints against the new algorithm's params before committing the change.
    // Format is reset silently. Type changes that would update object types require confirmation.
    // Cancel leaves everything unchanged — no rollback needed.
    async function handleAlgorithmChange(value: string) {
        const newAlgorithmId = value === "" ? null : Number(value);

        if (newAlgorithmId === null) {
            setComputationAlgorithmId(null);
            return;
        }

        const { env, computation, setFormat, setType } = useEnvStore.getState();
        const providerId = computation.selectedProviderId;

        if (providerId === null) {
            setComputationAlgorithmId(newAlgorithmId);
            return;
        }

        const newParams = useComputationCatalogStore.getState().parameters.filter(
            (p) => p.algorithmId === newAlgorithmId && p.computationProviderId === providerId,
        );
        const { objects, updateObjectsType } = useCanvasObjectStore.getState();

        // ── Format (silent reset) ─────────────────────────────────────────────
        const formatParam = newParams.find((p) => p.appHandler === APP_PARAMETER_HANDLER.ENVIRONMENT_FORMAT);
        let newFormat: EnvFormat | undefined;

        if (formatParam !== undefined && formatParam.enumValues.length > 0) {
            const currentFormatLabel = ENV_FORMAT_OPTIONS.find((opt) => opt.value === env.format)?.label;
            const isValid = currentFormatLabel !== undefined && formatParam.enumValues.includes(currentFormatLabel);

            if (!isValid) {
                const resolved =
                    ENV_FORMAT_OPTIONS.find((opt) => opt.label !== "" && opt.label === formatParam.defaultValue) ??
                    ENV_FORMAT_OPTIONS.find((opt) => opt.label !== "" && formatParam.enumValues.includes(opt.label));
                if (resolved !== undefined) newFormat = resolved.value as EnvFormat;
            }
        }

        // ── Type (confirm if objects would be affected) ───────────────────────
        const typeParam = newParams.find((p) => p.appHandler === APP_PARAMETER_HANDLER.ENVIRONMENT_TYPE);
        let newType: GlobalType | undefined;

        if (typeParam !== undefined && typeParam.enumValues.length > 0) {
            const currentTypeLabel = GLOBAL_TYPE_OPTIONS.find((opt) => opt.value === env.type)?.label;
            const isValid = currentTypeLabel !== undefined && typeParam.enumValues.includes(currentTypeLabel);

            if (!isValid) {
                const resolved =
                    GLOBAL_TYPE_OPTIONS.find((opt) => opt.label !== "" && opt.label === typeParam.defaultValue) ??
                    GLOBAL_TYPE_OPTIONS.find((opt) => opt.label !== "" && typeParam.enumValues.includes(opt.label));
                if (resolved !== undefined) newType = resolved.value as GlobalType;
            }
        }

        if (newType !== undefined && isGlobalTypeFixed(newType)) {
            const nextObjectType = defaultObjectTypeForGlobal(newType);
            const mismatchCount = objects.filter((obj) => obj.type !== nextObjectType).length;

            if (mismatchCount > 0) {
                const typeLabel = nextObjectType === "online" ? "On-Line" : "Off-Line";
                useConfirmationModalStore.getState().requestConfirmation({
                    title: "Update object types",
                    message: `Switching algorithm requires changing the global type to "${typeLabel}". ${mismatchCount} object${mismatchCount !== 1 ? "s" : ""} will be updated to match. Continue?`,
                    tone: "warning",
                    confirmLabel: "Confirm",
                    cancelLabel: "Cancel",
                    confirmAction: async () => {
                        if (newFormat !== undefined) setFormat(newFormat);
                        updateObjectsType(nextObjectType);
                        setType(newType!);
                        setComputationAlgorithmId(newAlgorithmId);
                    },
                });
                return;
            }

            updateObjectsType(nextObjectType);
        }

        if (newFormat !== undefined) setFormat(newFormat);
        if (newType !== undefined) setType(newType);
        setComputationAlgorithmId(newAlgorithmId);
    }

    const providerOptions = useMemo(
        () => [
            { value: "", label: "" },
            ...providers
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
            ...algorithms.map((algorithm) => ({
                value: String(algorithm.id),
                label: algorithm.name,
            })),
        ],
        [algorithms],
    );

    const parameterSections = useMemo(() => groupParametersBySection(parameters), [parameters]);

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
                    disabled={providers.length === 0}
                />

                <ControlsPanelSectionSelect
                    label="Algorithm"
                    value={selectedAlgorithmValue}
                    onChange={(value) => { handleAlgorithmChange(value).catch(console.error); }}
                    options={algorithmOptions}
                    disabled={computation.selectedProviderId === null || algorithms.length === 0}
                />
            </ControlsPanelSection>

            <ControlsPanelSeparator />

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
                            parameterValues={parameterValues}
                            appEnums={resolvedAppEnums}
                            onChange={(parameterId, value) => {
                                setParameterValueInStore(
                                    parameterId,
                                    computation.selectedAlgorithmId!,
                                    computation.selectedProviderId!,
                                    envId,
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