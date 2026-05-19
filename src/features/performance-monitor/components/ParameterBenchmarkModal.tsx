import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    COORD_SYSTEM_OPTIONS,
    ENV_FORMAT_OPTIONS,
    ENV_TYPE_OPTIONS,
} from "@/config/db-ops/enums";
import { validateGeneratorSystemParams } from "@/features/canvas-editing/utils/envGenerator";
import type { CoordSystemType, EnvFormat } from "@/config/db-ops/enums";
import {
    useParameterBenchmarkModalStore,
    type BenchmarkEnvironmentSetup,
    type BenchmarkExecutionState,
    type BenchmarkFixedParameter,
    type BenchmarkMetricType,
    type BenchmarkMultipleRunsSetup,
    type BenchmarkParameterSetup,
    type BenchmarkSystemEnvironmentSetup,
} from "@/features/performance-monitor/stores/parameterBenchmarkModalStore";
import { runBenchmark as runBenchmarkService } from "@/features/performance-monitor/data/benchmarkRunnerService";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useModalLifecycle } from "@/hooks/modals/useModalLifecycle";
import ModalTitle from "@/components/modal/modal-title/ModalTitle";
import ModalFooterButton from "@/components/modal/modal-footer/ModalFooterButton";
import type { AlgorithmMetric, AlgorithmParameter, ComputationAlgorithm, ComputationProvider } from "@/types/serviceTypes";
import ChartCard from "@/features/performance-monitor/components/internal/ChartCard";
import InternalCardModalFastTab from "@/components/modals/card-modal/internal/InternalCardModalFastTab";
import CardModalField from "@/components/modals/card-modal/CardModalField";

export default function ParameterBenchmarkModal() {
    const {
        isOpen,
        close,
        selectedProviderId,
        selectedAlgorithmId,
        targetParameterSetup,
        fixedParameters,
        environmentSetup,
        systemEnvironmentSetup,
        multipleRunsSetup,
        metricsConfig,
        isRunning,
        error,
        setIsRunning,
        setError,
        setSelectedProvider,
        setSelectedAlgorithm,
        setTargetParameterSetup,
        setFixedParameter,
        removeFixedParameter,
        setEnvironmentSetup,
        setSystemEnvironmentSetup,
        setMultipleRunsSetup,
        toggleMetric,
        executionState,
        setBenchmarkExecutionState,
        addStepResult,
        resetResults,
        cancelBenchmark,
        reset,
    } = useParameterBenchmarkModalStore();

    const { providers, algorithms, parameters: catalogParameters, metrics: catalogMetrics } = useComputationCatalogStore();
    const { handleBackdropMouseDown } = useModalLifecycle({
        isOpen,
        shortcutToken: "parameter-benchmark-modal",
        onClose: close,
    });

    const [activeTab, setActiveTab] = useState<"setup" | "run">("setup");

    // Filtered data
    const selectedProvider = useMemo(
        () => providers.find((p) => p.id === selectedProviderId),
        [providers, selectedProviderId],
    );

    const availableAlgorithms = useMemo(
        () => (selectedProviderId ? algorithms.filter((a) => a.computationProviderId === selectedProviderId) : []),
        [algorithms, selectedProviderId],
    );

    const selectedAlgorithm = useMemo(
        () => availableAlgorithms.find((a) => a.id === selectedAlgorithmId),
        [availableAlgorithms, selectedAlgorithmId],
    );

    const algorithmParameters = useMemo(
        () =>
            selectedAlgorithmId && selectedProviderId
                ? catalogParameters.filter(
                    (p) => p.algorithmId === selectedAlgorithmId && p.computationProviderId === selectedProviderId,
                )
                : [],
        [catalogParameters, selectedAlgorithmId, selectedProviderId],
    );

    const numericParameters = useMemo(
        () => algorithmParameters.filter((p) => p.paramType === "Integer" || p.paramType === "Decimal"),
        [algorithmParameters],
    );

    const algorithmMetrics = useMemo(
        () =>
            selectedAlgorithmId && selectedProviderId
                ? catalogMetrics.filter(
                    (m) => m.algorithmId === selectedAlgorithmId && m.computationProviderId === selectedProviderId,
                )
                : [],
        [catalogMetrics, selectedAlgorithmId, selectedProviderId],
    );

    const nonTargetParameters = useMemo(
        () => algorithmParameters.filter((p) => p.id !== targetParameterSetup?.targetParamId),
        [algorithmParameters, targetParameterSetup],
    );

    const selectedTargetParameter = useMemo(
        () => algorithmParameters.find((p) => p.id === targetParameterSetup?.targetParamId),
        [algorithmParameters, targetParameterSetup],
    );

    // Validation
    const isSetupValid = useMemo(() => {
        if (!selectedProvider || !selectedAlgorithm || !targetParameterSetup) return false;
        const { startValue, endValue, stepValue } = targetParameterSetup;
        const start = Number(startValue);
        const end = Number(endValue);
        const step = Number(stepValue);
        return !isNaN(start) && !isNaN(end) && !isNaN(step) && step > 0 && start <= end;
    }, [selectedProvider, selectedAlgorithm, targetParameterSetup]);

    const generatorSystemValidation = useMemo(() => validateGeneratorSystemParams({
        format: systemEnvironmentSetup.format as EnvFormat,
        coordSystem: systemEnvironmentSetup.coordinateSystem as CoordSystemType,
    }), [systemEnvironmentSetup.format, systemEnvironmentSetup.coordinateSystem]);

    // Reset tab when modal closes
    useEffect(() => {
        if (!isOpen) setActiveTab("setup");
    }, [isOpen]);

    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStartBenchmark = useCallback(async () => {
        if (!selectedProvider || !selectedAlgorithm || !targetParameterSetup) {
            return;
        }

        if (!generatorSystemValidation.ok) {
            setError(generatorSystemValidation.error ?? "Unsupported system environment setup for benchmark generation.");
            return;
        }

        const start = Number(targetParameterSetup.startValue);
        const end = Number(targetParameterSetup.endValue);
        const step = Number(targetParameterSetup.stepValue);
        const estimatedStepCount =
            Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(step) && step > 0
                ? Math.floor((end - start) / step) + 1
                : 0;
        const totalSteps = Math.max(estimatedStepCount, 0);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsRunning(true);
        setError(null);
        resetResults();

        setBenchmarkExecutionState({
            status: "running",
            progress: {
                totalSteps,
                completedSteps: 0,
                totalRuns: totalSteps * multipleRunsSetup.runsPerStep,
                completedRuns: 0,
            },
            results: [],
            abortSignal: controller.signal,
            error: undefined,
        });

        try {
            const results = await runBenchmarkService({
                provider: selectedProvider,
                algorithm: selectedAlgorithm,
                algorithmParameters,
                algorithmMetrics,
                targetParameterSetup,
                fixedParameters,
                environmentSetup,
                systemEnvironmentSetup,
                multipleRunsSetup,
                selectedMetrics: metricsConfig.selectedMetrics,
                signal: controller.signal,
                onProgress: (progress) => setBenchmarkExecutionState({ progress }),
                onStepCompleted: (result) => addStepResult(result),
            });

            setBenchmarkExecutionState({
                status: controller.signal.aborted ? "cancelled" : "completed",
                results,
                abortSignal: undefined,
            });
        } catch (runError) {
            const message = runError instanceof Error ? runError.message : String(runError);

            if (controller.signal.aborted) {
                setBenchmarkExecutionState({ status: "cancelled", abortSignal: undefined });
            } else {
                setError(message);
                setBenchmarkExecutionState({
                    status: "error",
                    error: message,
                    abortSignal: undefined,
                });
            }
        } finally {
            setIsRunning(false);
            abortControllerRef.current = null;
        }
    }, [
        selectedProvider,
        selectedAlgorithm,
        targetParameterSetup,
        setIsRunning,
        setError,
        resetResults,
        setBenchmarkExecutionState,
        multipleRunsSetup.runsPerStep,
        algorithmParameters,
        algorithmMetrics,
        fixedParameters,
        environmentSetup,
        systemEnvironmentSetup,
        multipleRunsSetup,
        metricsConfig.selectedMetrics,
        addStepResult,
        generatorSystemValidation.error,
        generatorSystemValidation.ok,
    ]);

    const handleCancelBenchmark = useCallback(() => {
        abortControllerRef.current?.abort();
        cancelBenchmark();
    }, [cancelBenchmark]);

    const handleCloseModal = useCallback(() => {
        abortControllerRef.current?.abort();
        reset();
    }, [reset]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropMouseDown}
        >
            <div className="flex flex-col w-200 max-h-[85vh] bg-gray-100 rounded-lg shadow-xl overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-200 shrink-0">
                    <ModalTitle title="Parameter Benchmark" onClose={close} />
                </div>

                {/* Tab Bar */}
                <div className="flex shrink-0 border-b border-gray-300 bg-gray-100">
                    <button
                        type="button"
                        onClick={() => setActiveTab("setup")}
                        className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none border-b-2 -mb-px
                            ${activeTab === "setup"
                                ? "border-teal-600 text-teal-700"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        Setup
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("run")}
                        disabled={!isSetupValid}
                        className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none border-b-2 -mb-px
                            ${activeTab === "run"
                                ? "border-teal-600 text-teal-700"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            } ${!isSetupValid ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                        Run
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "setup" ? (
                        <SetupTabContent
                            providers={providers}
                            selectedProviderId={selectedProviderId}
                            onSelectProvider={setSelectedProvider}
                            availableAlgorithms={availableAlgorithms}
                            selectedAlgorithm={selectedAlgorithm}
                            onSelectAlgorithm={setSelectedAlgorithm}
                            numericParameters={numericParameters}
                            targetParameterSetup={targetParameterSetup}
                            onSetTargetParameter={setTargetParameterSetup}
                            nonTargetParameters={nonTargetParameters}
                            fixedParameters={fixedParameters}
                            onSetFixedParameter={setFixedParameter}
                            onRemoveFixedParameter={removeFixedParameter}
                            environmentSetup={environmentSetup}
                            onSetEnvironmentSetup={setEnvironmentSetup}
                            multipleRunsSetup={multipleRunsSetup}
                            onSetMultipleRunsSetup={setMultipleRunsSetup}
                            metricsConfig={metricsConfig}
                            onToggleMetric={toggleMetric}
                        />
                    ) : (
                        <RunTabContent
                            selectedProvider={selectedProvider}
                            selectedAlgorithm={selectedAlgorithm}
                            targetParameterSetup={targetParameterSetup}
                            targetParameterName={selectedTargetParameter?.name ?? "Parameter"}
                            fixedParameters={fixedParameters}
                            environmentSetup={environmentSetup}
                            systemEnvironmentSetup={systemEnvironmentSetup}
                            multipleRunsSetup={multipleRunsSetup}
                            metricsConfig={metricsConfig}
                            isRunning={isRunning}
                            error={error}
                            executionState={executionState}
                            onStartBenchmark={handleStartBenchmark}
                            onCancelBenchmark={handleCancelBenchmark}
                            canStartBenchmark={generatorSystemValidation.ok}
                            systemParamsError={generatorSystemValidation.error}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 shrink-0">
                    <ModalFooterButton onClick={handleCloseModal}>Close</ModalFooterButton>
                </div>
            </div>
        </div>
    );
}

// ─── Setup Tab ────────────────────────────────────────────────────────────────

interface SetupTabContentProps {
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
    environmentSetup: any;
    onSetEnvironmentSetup: (setup: any) => void;
    multipleRunsSetup: any;
    onSetMultipleRunsSetup: (setup: any) => void;
    metricsConfig: any;
    onToggleMetric: (metric: BenchmarkMetricType) => void;
}

function SetupTabContent({
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
    environmentSetup,
    onSetEnvironmentSetup,
    multipleRunsSetup,
    onSetMultipleRunsSetup,
    metricsConfig,
    onToggleMetric,
}: SetupTabContentProps) {
    const [computationExpanded, setComputationExpanded] = useState(true);
    const [targetParamExpanded, setTargetParamExpanded] = useState(true);
    const [fixedParamsExpanded, setFixedParamsExpanded] = useState(true);
    const [generatorExpanded, setGeneratorExpanded] = useState(true);
    const [multipleRunsExpanded, setMultipleRunsExpanded] = useState(true);
    const [metricsExpanded, setMetricsExpanded] = useState(true);

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
                {selectedProviderId !== null && (
                    <CardModalField
                        id="algorithm"
                        label="Algorithm"
                        type="select"
                        value={selectedAlgorithm !== undefined ? String(selectedAlgorithm.id) : ""}
                        options={[
                            { value: "", label: "" },
                            ...availableAlgorithms.map((a) => ({ value: String(a.id), label: a.name })),
                        ]}
                        onChange={(v) => onSelectAlgorithm(v ? Number(v) : null)}
                    />
                )}
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
                {targetParameterSetup && (
                    <>
                        <CardModalField
                            id="target-start"
                            label="Start"
                            type="number"
                            value={targetParameterSetup.startValue}
                            onChange={(v) => onSetTargetParameter({ ...targetParameterSetup, startValue: v })}
                        />
                        <CardModalField
                            id="target-end"
                            label="End"
                            type="number"
                            value={targetParameterSetup.endValue}
                            onChange={(v) => onSetTargetParameter({ ...targetParameterSetup, endValue: v })}
                        />
                        <CardModalField
                            id="target-step"
                            label="Step"
                            type="number"
                            value={targetParameterSetup.stepValue}
                            onChange={(v) => onSetTargetParameter({ ...targetParameterSetup, stepValue: v })}
                        />
                    </>
                )}
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
                    return (
                        <CardModalField
                            key={param.id}
                            id={`fixed-param-${param.id}`}
                            label={param.name}
                            type="text"
                            value={fixedValue?.value ?? param.defaultValue ?? ""}
                            placeholder={param.defaultValue || ""}
                            onChange={(v) => onSetFixedParameter(param.id, v)}
                        />
                    );
                })}
            </InternalCardModalFastTab>

            {/* Generator */}
            <InternalCardModalFastTab
                title="Generator"
                expanded={generatorExpanded}
                onToggle={() => setGeneratorExpanded((x) => !x)}
            >
                <CardModalField
                    id="gen-width"
                    label="Width"
                    type="number"
                    value={String(environmentSetup.width)}
                    onChange={(v) => onSetEnvironmentSetup({ width: Number(v) })}
                />
                <CardModalField
                    id="gen-height"
                    label="Height"
                    type="number"
                    value={String(environmentSetup.height)}
                    onChange={(v) => onSetEnvironmentSetup({ height: Number(v) })}
                />
                <CardModalField
                    id="gen-cell-size"
                    label="Cell Size"
                    type="number"
                    value={String(environmentSetup.cellSize)}
                    onChange={(v) => onSetEnvironmentSetup({ cellSize: Number(v) })}
                />
                <CardModalField
                    id="gen-obstacle-ratio"
                    label="Obstacle Ratio (%)"
                    type="number"
                    value={String(environmentSetup.obstacleRatio)}
                    onChange={(v) => onSetEnvironmentSetup({ obstacleRatio: Number(v) })}
                />
                <CardModalField
                    id="gen-clustering-prob"
                    label="Clustering Prob (%)"
                    type="number"
                    value={String(environmentSetup.clusteringProb)}
                    onChange={(v) => onSetEnvironmentSetup({ clusteringProb: Number(v) })}
                />
                <CardModalField
                    id="gen-seed"
                    label="Seed"
                    type="text"
                    value={String(environmentSetup.seed)}
                    onChange={(v) => onSetEnvironmentSetup({ seed: v })}
                />
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

// ΓöÇΓöÇΓöÇ Run Tab ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

interface RunTabContentProps {
    selectedProvider: ComputationProvider | undefined;
    selectedAlgorithm: ComputationAlgorithm | undefined;
    targetParameterSetup: BenchmarkParameterSetup | null;
    targetParameterName: string;
    fixedParameters: BenchmarkFixedParameter[];
    environmentSetup: BenchmarkEnvironmentSetup;
    systemEnvironmentSetup: BenchmarkSystemEnvironmentSetup;
    multipleRunsSetup: BenchmarkMultipleRunsSetup;
    metricsConfig: { selectedMetrics: Set<BenchmarkMetricType> };
    isRunning: boolean;
    error: string | null;
    executionState: BenchmarkExecutionState;
    onStartBenchmark: () => void;
    onCancelBenchmark: () => void;
    canStartBenchmark: boolean;
    systemParamsError: string | null;
}

function RunTabContent({
    selectedProvider,
    selectedAlgorithm,
    targetParameterSetup,
    targetParameterName,
    fixedParameters,
    environmentSetup,
    systemEnvironmentSetup,
    multipleRunsSetup,
    metricsConfig,
    isRunning,
    error,
    executionState,
    onStartBenchmark,
    onCancelBenchmark,
    canStartBenchmark,
    systemParamsError,
}: RunTabContentProps) {
    const metricLabels: Record<BenchmarkMetricType, string> = {
        coverage: "Coverage Ratio",
        overlap: "Overlap Ratio",
        efficiency: "Efficiency",
        turns: "Number of Turns",
        pathLength: "Path Length",
    };

    const selectedMetrics = Array.from(metricsConfig.selectedMetrics);
    const aggregateKey = multipleRunsSetup.stepValueCalculation;

    const chartSeries = useMemo(() => {
        const sorted = [...executionState.results].sort((a, b) => a.stepValue - b.stepValue);
        const metricLabels: Record<BenchmarkMetricType, string> = {
            coverage: "Coverage Ratio",
            overlap: "Overlap Ratio",
            efficiency: "Efficiency",
            turns: "Number of Turns",
            pathLength: "Path Length",
        };

        return selectedMetrics.map((metric, idx) => ({
            metric,
            metricId: 10000 + idx,
            name: `${metricLabels[metric]} vs ${targetParameterName}`,
            data: sorted.map((result) => ({
                x: result.stepValue,
                y: result.aggregatedMetrics[metric][aggregateKey] ?? Number.NaN,
            })),
        }));
    }, [executionState.results, selectedMetrics, aggregateKey, targetParameterName]);

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Summary */}
            <div className="p-3 bg-gray-50 border border-gray-300 rounded">
                <div className="text-sm font-medium text-gray-700 mb-2">Benchmark Configuration</div>
                <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Provider:</strong> {selectedProvider?.name}</div>
                    <div><strong>Algorithm:</strong> {selectedAlgorithm?.name}</div>
                    <div><strong>Target Parameter:</strong> Varying</div>
                    <div><strong>Environment:</strong> {environmentSetup.width}├ù{environmentSetup.height} cells, {environmentSetup.cellSize} cell size</div>
                    <div><strong>Runs per Step:</strong> {multipleRunsSetup.runsPerStep}</div>
                    <div><strong>Aggregate Method:</strong> {multipleRunsSetup.stepValueCalculation}</div>
                    <div><strong>Format:</strong> {ENV_FORMAT_OPTIONS.find((x) => x.value === systemEnvironmentSetup.format)?.label ?? systemEnvironmentSetup.format}</div>
                    <div><strong>Type:</strong> {ENV_TYPE_OPTIONS.find((x) => x.value === systemEnvironmentSetup.type)?.label ?? systemEnvironmentSetup.type}</div>
                    <div><strong>Coordinate System:</strong> {systemEnvironmentSetup.coordinateSystem}</div>
                    <div><strong>Headland:</strong> {systemEnvironmentSetup.headland ? "Enabled" : "Disabled"}</div>
                    <div><strong>Headland Width:</strong> {systemEnvironmentSetup.headlandWidth}</div>
                    <div>
                        <strong>Tracked Metrics:</strong> {
                            selectedMetrics
                                .map((metric) => metricLabels[metric])
                                .join(", ")
                        }
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-700">
                    <span>
                        Progress: {executionState.progress.completedSteps}/{executionState.progress.totalSteps} steps ΓÇó {executionState.progress.completedRuns}/{executionState.progress.totalRuns} runs
                    </span>
                    <span className="font-medium uppercase tracking-wide">{executionState.status}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded overflow-hidden">
                    <div
                        className="h-full bg-teal-500 transition-all"
                        style={{
                            width: `${executionState.progress.totalRuns > 0
                                ? (executionState.progress.completedRuns / executionState.progress.totalRuns) * 100
                                : 0}%`,
                        }}
                    />
                </div>
                {typeof executionState.progress.currentStepValue === "number" && typeof executionState.progress.currentRunIndex === "number" && (
                    <div className="text-xs text-slate-600">
                        Running step value <strong>{executionState.progress.currentStepValue}</strong>, run {executionState.progress.currentRunIndex + 1}/{multipleRunsSetup.runsPerStep}
                    </div>
                )}
            </div>

            {/* Status */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="text-sm font-medium text-red-900">Error</div>
                    <div className="text-xs text-red-700 mt-1">{error}</div>
                </div>
            )}

            {systemParamsError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                    <div className="text-sm font-medium text-amber-900">Generator Compatibility</div>
                    <div className="text-xs text-amber-800 mt-1">{systemParamsError}</div>
                </div>
            )}

            {isRunning && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <div className="text-sm text-blue-900">Running benchmarks...</div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onStartBenchmark}
                    disabled={isRunning || !canStartBenchmark}
                    className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors ${isRunning
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-teal-600 hover:bg-teal-700 active:bg-teal-800"
                        }`}
                >
                    {isRunning ? "Running..." : "Start Benchmark"}
                </button>

                <button
                    type="button"
                    onClick={onCancelBenchmark}
                    disabled={!isRunning}
                    className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors ${!isRunning
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
                        }`}
                >
                    Cancel Benchmark
                </button>
            </div>

            {/* Live Results */}
            <div className="border border-gray-300 rounded bg-white overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
                    Live Results
                </div>
                {executionState.results.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-8">
                        Benchmark results will appear here
                    </div>
                ) : (
                    <div className="max-h-80 overflow-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-100 text-gray-700 sticky top-0">
                                <tr>
                                    <th className="px-2 py-2 text-left">Step</th>
                                    <th className="px-2 py-2 text-left">Runs</th>
                                    {selectedMetrics.map((metric) => (
                                        <th key={metric} className="px-2 py-2 text-left">{metricLabels[metric]}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {executionState.results.map((stepResult) => (
                                    <tr key={stepResult.stepValue} className="border-t border-gray-100">
                                        <td className="px-2 py-2 font-medium text-gray-800">{stepResult.stepValue}</td>
                                        <td className="px-2 py-2 text-gray-600">
                                            {stepResult.runsCompleted} ok / {stepResult.runsFailed} failed
                                        </td>
                                        {selectedMetrics.map((metric) => {
                                            const aggregate = stepResult.aggregatedMetrics[metric][aggregateKey];
                                            return (
                                                <td key={metric} className="px-2 py-2 text-gray-700">
                                                    {typeof aggregate === "number" ? aggregate.toFixed(3) : "ΓÇö"}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Charts */}
            <div className="border border-gray-300 rounded bg-white overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
                    Benchmark Trend Charts
                </div>
                {chartSeries.length === 0 || executionState.results.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-8">
                        Complete at least one benchmark step to render charts.
                    </div>
                ) : (
                    <div className="p-3 flex flex-col gap-3 max-h-112 overflow-y-auto">
                        {chartSeries.map((series) => (
                            <ChartCard
                                key={series.metric}
                                metricId={series.metricId}
                                name={series.name}
                                data={series.data}
                                xAxisLabel={targetParameterName}
                                yAxisLabel={series.name.split(" vs ")[0]}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
