import { useState } from "react";
import InternalCardModalFastTab from "@/components/modals/card-modal/internal/InternalCardModalFastTab";
import CardModalField from "@/components/modals/card-modal/CardModalField";
import {
    type BenchmarkMetricType,
    type BenchmarkParameterSetup,
} from "@/features/benchmark-manager/stores/benchmarkModalStore";
import type { AlgorithmParameter, ComputationAlgorithm, ComputationProvider } from "@/types/serviceTypes";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BenchmarkSetupTabProps {
    providers: ComputationProvider[];
    selectedProviderId: number | null;
    onSelectProvider: (providerId: number | null) => void;
    availableAlgorithms: ComputationAlgorithm[];
    selectedAlgorithm: ComputationAlgorithm | undefined;
    onSelectAlgorithm: (algorithmId: number | null) => void;
    numericParameters: AlgorithmParameter[];
    targetParameterSetup: BenchmarkParameterSetup | null;
    onSetTargetParameter: (setup: any) => void;
    nonTargetParameters: AlgorithmParameter[];
    fixedParameters: any[];
    onSetFixedParameter: (paramId: number, value: string) => void;
    onRemoveFixedParameter: (paramId: number) => void;
    multipleRunsSetup: any;
    onSetMultipleRunsSetup: (setup: any) => void;
    metricsConfig: any;
    onToggleMetric: (metric: BenchmarkMetricType) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BenchmarkSetupTab({
    providers,
    selectedProviderId,
    onSelectProvider,
    availableAlgorithms,
    selectedAlgorithm,
    onSelectAlgorithm,
    numericParameters,
    targetParameterSetup,
    onSetTargetParameter,
    nonTargetParameters,
    fixedParameters,
    onSetFixedParameter,
    onRemoveFixedParameter,
    multipleRunsSetup,
    onSetMultipleRunsSetup,
    metricsConfig,
    onToggleMetric,
}: BenchmarkSetupTabProps) {
    const [computationExpanded, setComputationExpanded] = useState(true);
    const [targetParamExpanded, setTargetParamExpanded] = useState(true);
    const [fixedParamsExpanded, setFixedParamsExpanded] = useState(true);
    const [multipleRunsExpanded, setMultipleRunsExpanded] = useState(true);
    const [metricsExpanded, setMetricsExpanded] = useState(true);

    const targetParam = numericParameters.find((p) => p.id === targetParameterSetup?.targetParamId);

    const targetParamDisabled = numericParameters.length === 0;
    const fixedParamsDisabled = nonTargetParameters.length === 0;

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Computation */}
            <InternalCardModalFastTab
                title="Computation"
                expanded={computationExpanded}
                onToggle={() => setComputationExpanded((x) => !x)}
            >
                <CardModalField
                    id="provider"
                    label="Provider"
                    type="select"
                    value={selectedProviderId !== null ? String(selectedProviderId) : ""}
                    options={[
                        { value: "", label: "" },
                        ...providers.map((p) => ({ value: String(p.id), label: p.name })),
                    ]}
                    onChange={(v) => onSelectProvider(v ? Number(v) : null)}
                />
                <CardModalField
                    id="algorithm"
                    label="Algorithm"
                    type="select"
                    disabled={selectedProviderId === null}
                    value={selectedAlgorithm !== undefined ? String(selectedAlgorithm.id) : ""}
                    options={[
                        { value: "", label: "" },
                        ...availableAlgorithms.map((a) => ({ value: String(a.id), label: a.name })),
                    ]}
                    onChange={(v) => onSelectAlgorithm(v ? Number(v) : null)}
                />
            </InternalCardModalFastTab>

            {/* Target Parameter */}
            <InternalCardModalFastTab
                title="Target Parameter"
                expanded={targetParamDisabled ? false : targetParamExpanded}
                onToggle={targetParamDisabled ? () => { } : () => setTargetParamExpanded((x) => !x)}
                disabled={targetParamDisabled}
            >
                <CardModalField
                    id="target-param"
                    label="Parameter"
                    type="select"
                    value={targetParameterSetup?.targetParamId !== undefined ? String(targetParameterSetup.targetParamId) : ""}
                    options={[
                        { value: "", label: "" },
                        ...numericParameters.map((p) => ({ value: String(p.id), label: p.name })),
                    ]}
                    onChange={(v) => {
                        if (!v) { onSetTargetParameter(null); return; }
                        const paramId = Number(v);
                        const param = numericParameters.find((p) => p.id === paramId);
                        if (param) {
                            onSetTargetParameter({
                                targetParamId: paramId,
                                startValue: param.defaultValue || param.minValue?.toString() || "0",
                                endValue: param.maxValue?.toString() || "100",
                                stepValue: "1",
                            });
                        }
                    }}
                />
                <CardModalField
                    id="target-start"
                    label="Start"
                    unitType={targetParam?.unitType}
                    type="number"
                    disabled={!targetParameterSetup}
                    value={targetParameterSetup?.startValue ?? ""}
                    onChange={(v) => targetParameterSetup && onSetTargetParameter({ ...targetParameterSetup, startValue: v })}
                />
                <CardModalField
                    id="target-end"
                    label="End"
                    unitType={targetParam?.unitType}
                    type="number"
                    disabled={!targetParameterSetup}
                    value={targetParameterSetup?.endValue ?? ""}
                    onChange={(v) => targetParameterSetup && onSetTargetParameter({ ...targetParameterSetup, endValue: v })}
                />
                <CardModalField
                    id="target-step"
                    label="Step"
                    unitType={targetParam?.unitType}
                    type="number"
                    disabled={!targetParameterSetup}
                    value={targetParameterSetup?.stepValue ?? ""}
                    onChange={(v) => targetParameterSetup && onSetTargetParameter({ ...targetParameterSetup, stepValue: v })}
                />
            </InternalCardModalFastTab>

            {/* Fixed Parameters */}
            <InternalCardModalFastTab
                title="Fixed Parameters"
                expanded={fixedParamsDisabled ? false : fixedParamsExpanded}
                onToggle={fixedParamsDisabled ? () => { } : () => setFixedParamsExpanded((x) => !x)}
                disabled={fixedParamsDisabled}
            >
                {nonTargetParameters.map((param) => {
                    const fixedValue = fixedParameters.find((fp) => fp.paramId === param.id);
                    const rawValue = fixedValue?.value ?? param.defaultValue ?? "";

                    if (param.paramType === "Enum") {
                        return (
                            <CardModalField
                                key={param.id}
                                id={`fixed-param-${param.id}`}
                                label={param.name}
                                type="select"
                                value={rawValue || (param.enumValues[0] ?? "")}
                                options={param.enumValues.map((v) => ({ value: v, label: v }))}
                                onChange={(v: string) => onSetFixedParameter(param.id, v)}
                            />
                        );
                    }

                    if (param.paramType === "Boolean") {
                        return (
                            <CardModalField
                                key={param.id}
                                id={`fixed-param-${param.id}`}
                                label={param.name}
                                type="checkbox"
                                checked={rawValue === "true"}
                                onChange={(v) => onSetFixedParameter(param.id, String(v))}
                            />
                        );
                    }

                    return (
                        <CardModalField
                            key={param.id}
                            id={`fixed-param-${param.id}`}
                            label={param.name}
                            unitType={param.unitType}
                            type={param.paramType as "Integer" | "Decimal" | "String"}
                            value={rawValue}
                            min={param.minValue}
                            max={param.maxValue}
                            placeholder={param.defaultValue || ""}
                            onChange={(v: string) => onSetFixedParameter(param.id, v)}
                        />
                    );
                })}
            </InternalCardModalFastTab>

            {/* Multiple Runs */}
            <InternalCardModalFastTab
                title="Multiple Runs"
                expanded={multipleRunsExpanded}
                onToggle={() => setMultipleRunsExpanded((x) => !x)}
            >
                <CardModalField
                    id="runs-per-step"
                    label="Runs per Step"
                    type="number"
                    value={String(multipleRunsSetup.runsPerStep)}
                    onChange={(v) => onSetMultipleRunsSetup({ runsPerStep: Math.max(1, Number(v)) })}
                />
                <CardModalField
                    id="aggregate-method"
                    label="Aggregate Method"
                    type="select"
                    value={multipleRunsSetup.stepValueCalculation}
                    options={[
                        { value: "median", label: "Median" },
                        { value: "average", label: "Average" },
                    ]}
                    onChange={(v) => onSetMultipleRunsSetup({ stepValueCalculation: v as any })}
                />
            </InternalCardModalFastTab>

            {/* Metrics */}
            <InternalCardModalFastTab
                title="Metrics"
                expanded={metricsExpanded}
                onToggle={() => setMetricsExpanded((x) => !x)}
            >
                <CardModalField id="metric-coverage" label="Coverage Ratio" type="checkbox" checked={metricsConfig.selectedMetrics.has("coverage")} onChange={() => onToggleMetric("coverage")} />
                <CardModalField id="metric-overlap" label="Overlap Ratio" type="checkbox" checked={metricsConfig.selectedMetrics.has("overlap")} onChange={() => onToggleMetric("overlap")} />
                <CardModalField id="metric-efficiency" label="Efficiency" type="checkbox" checked={metricsConfig.selectedMetrics.has("efficiency")} onChange={() => onToggleMetric("efficiency")} />
                <CardModalField id="metric-turns" label="Number of Turns" type="checkbox" checked={metricsConfig.selectedMetrics.has("turns")} onChange={() => onToggleMetric("turns")} />
                <CardModalField id="metric-path-length" label="Path Length" type="checkbox" checked={metricsConfig.selectedMetrics.has("pathLength")} onChange={() => onToggleMetric("pathLength")} />
            </InternalCardModalFastTab>
        </div>
    );
}
