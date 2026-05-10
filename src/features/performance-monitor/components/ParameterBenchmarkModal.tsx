import { useEffect, useMemo, useState } from "react";
import { useParameterBenchmarkModalStore, type BenchmarkMetricType, type BenchmarkParameterSetup } from "@/features/performance-monitor/stores/parameterBenchmarkModalStore";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useModalLifecycle } from "@/hooks/modals/useModalLifecycle";
import ModalTitle from "@/components/modal/modal-title/ModalTitle";
import ModalFooterButton from "@/components/modal/modal-footer/ModalFooterButton";
import type { AlgorithmParameter, ComputationAlgorithm, ComputationProvider } from "@/types/serviceTypes";

export default function ParameterBenchmarkModal() {
    const {
        isOpen,
        close,
        selectedProviderId,
        selectedAlgorithmId,
        targetParameterSetup,
        fixedParameters,
        environmentSetup,
        multipleRunsSetup,
        metricsConfig,
        isRunning,
        error,
        setSelectedProvider,
        setSelectedAlgorithm,
        setTargetParameterSetup,
        setFixedParameter,
        removeFixedParameter,
        setEnvironmentSetup,
        setMultipleRunsSetup,
        toggleMetric,
    } = useParameterBenchmarkModalStore();

    const { providers, algorithms, parameters: catalogParameters } = useComputationCatalogStore();
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

    const nonTargetParameters = useMemo(
        () => algorithmParameters.filter((p) => p.id !== targetParameterSetup?.targetParamId),
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

    // Reset tab when modal closes
    useEffect(() => {
        if (!isOpen) setActiveTab("setup");
    }, [isOpen]);

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
                            fixedParameters={fixedParameters}
                            environmentSetup={environmentSetup}
                            multipleRunsSetup={multipleRunsSetup}
                            metricsConfig={metricsConfig}
                            isRunning={isRunning}
                            error={error}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 shrink-0">
                    <ModalFooterButton onClick={close}>Close</ModalFooterButton>
                </div>
            </div>
        </div>
    );
}

// ─── Setup Tab ────────────────────────────────────────────────────────────────

interface SetupTabContentProps {
    providers: ComputationProvider[];
    selectedProviderId: number | null;
    onSelectProvider: (providerId: number) => void;
    availableAlgorithms: ComputationAlgorithm[];
    selectedAlgorithm: ComputationAlgorithm | undefined;
    onSelectAlgorithm: (algorithmId: number) => void;
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
    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Provider Selection */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Provider</label>
                <select
                    value={selectedProviderId ?? ""}
                    onChange={(e) => onSelectProvider(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                    <option value="">Select a provider...</option>
                    {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Algorithm Selection */}
            {selectedProviderId && (
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Algorithm</label>
                    <select
                        value={selectedAlgorithm?.id ?? ""}
                        onChange={(e) => onSelectAlgorithm(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">Select an algorithm...</option>
                        {availableAlgorithms.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Target Parameter Selection */}
            {numericParameters.length > 0 && (
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Target Parameter to Benchmark</label>
                    <select
                        value={targetParameterSetup?.targetParamId ?? ""}
                        onChange={(e) => {
                            const paramId = Number(e.target.value);
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
                        className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">Select a parameter...</option>
                        {numericParameters.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Target Parameter Range */}
            {targetParameterSetup && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded flex flex-col gap-3">
                    <div className="text-sm font-medium text-blue-900">Target Parameter Range</div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Start</label>
                            <input
                                type="number"
                                value={targetParameterSetup.startValue}
                                onChange={(e) =>
                                    onSetTargetParameter({
                                        ...targetParameterSetup,
                                        startValue: e.target.value,
                                    })
                                }
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">End</label>
                            <input
                                type="number"
                                value={targetParameterSetup.endValue}
                                onChange={(e) =>
                                    onSetTargetParameter({
                                        ...targetParameterSetup,
                                        endValue: e.target.value,
                                    })
                                }
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Step</label>
                            <input
                                type="number"
                                value={targetParameterSetup.stepValue}
                                onChange={(e) =>
                                    onSetTargetParameter({
                                        ...targetParameterSetup,
                                        stepValue: e.target.value,
                                    })
                                }
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Fixed Parameters */}
            {nonTargetParameters.length > 0 && (
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Fixed Parameters</label>
                    <div className="flex flex-col gap-2">
                        {nonTargetParameters.map((param) => {
                            const fixedValue = fixedParameters.find((fp) => fp.paramId === param.id);
                            return (
                                <div key={param.id} className="flex items-center gap-2">
                                    <label className="text-xs text-gray-600 flex-1">{param.name}</label>
                                    <input
                                        type="text"
                                        value={fixedValue?.value ?? param.defaultValue ?? ""}
                                        onChange={(e) => onSetFixedParameter(param.id, e.target.value)}
                                        placeholder={param.defaultValue || ""}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Environment Generation Setup */}
            <div className="p-3 bg-green-50 border border-green-200 rounded flex flex-col gap-3">
                <div className="text-sm font-medium text-green-900">Environment Generator Setup</div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Width</label>
                        <input
                            type="number"
                            value={environmentSetup.width}
                            onChange={(e) =>
                                onSetEnvironmentSetup({ width: Number(e.target.value) })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Height</label>
                        <input
                            type="number"
                            value={environmentSetup.height}
                            onChange={(e) =>
                                onSetEnvironmentSetup({ height: Number(e.target.value) })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Cell Size</label>
                        <input
                            type="number"
                            value={environmentSetup.cellSize}
                            onChange={(e) =>
                                onSetEnvironmentSetup({ cellSize: Number(e.target.value) })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Obstacle Ratio (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={environmentSetup.obstacleRatio}
                            onChange={(e) =>
                                onSetEnvironmentSetup({ obstacleRatio: Number(e.target.value) })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Clustering Prob (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={environmentSetup.clusteringProb}
                            onChange={(e) =>
                                onSetEnvironmentSetup({ clusteringProb: Number(e.target.value) })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Seed</label>
                        <input
                            type="text"
                            value={environmentSetup.seed}
                            onChange={(e) =>
                                onSetEnvironmentSetup({ seed: e.target.value })
                            }
                            placeholder="(empty = randomize)"
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>
            </div>

            {/* Multiple Runs Setup */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded flex flex-col gap-3">
                <div className="text-sm font-medium text-purple-900">Multiple Runs Configuration</div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Runs per Step</label>
                        <input
                            type="number"
                            min="1"
                            value={multipleRunsSetup.runsPerStep}
                            onChange={(e) =>
                                onSetMultipleRunsSetup({ runsPerStep: Math.max(1, Number(e.target.value)) })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Number of computations to run for each parameter value
                        </p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Aggregate Method</label>
                        <select
                            value={multipleRunsSetup.stepValueCalculation}
                            onChange={(e) =>
                                onSetMultipleRunsSetup({ stepValueCalculation: e.target.value as any })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="median">Median</option>
                            <option value="average">Average</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            How to combine metrics from multiple runs
                        </p>
                    </div>
                </div>
            </div>

            {/* Metrics to Track */}
            <div className="p-3 bg-teal-50 border border-teal-200 rounded flex flex-col gap-3">
                <div className="text-sm font-medium text-teal-900">Metrics to Track</div>

                <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={metricsConfig.selectedMetrics.has("coverage")}
                            onChange={() => onToggleMetric("coverage")}
                            className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-700">Coverage Ratio</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={metricsConfig.selectedMetrics.has("overlap")}
                            onChange={() => onToggleMetric("overlap")}
                            className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-700">Overlap Ratio</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={metricsConfig.selectedMetrics.has("efficiency")}
                            onChange={() => onToggleMetric("efficiency")}
                            className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-700">Efficiency</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={metricsConfig.selectedMetrics.has("turns")}
                            onChange={() => onToggleMetric("turns")}
                            className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-700">Number of Turns</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={metricsConfig.selectedMetrics.has("pathLength")}
                            onChange={() => onToggleMetric("pathLength")}
                            className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-700">Path Length</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

// ─── Run Tab ──────────────────────────────────────────────────────────────────

interface RunTabContentProps {
    selectedProvider: ComputationProvider | undefined;
    selectedAlgorithm: ComputationAlgorithm | undefined;
    targetParameterSetup: BenchmarkParameterSetup | null;
    fixedParameters: any[];
    environmentSetup: any;
    multipleRunsSetup: any;
    metricsConfig: any;
    isRunning: boolean;
    error: string | null;
}

function RunTabContent({
    selectedProvider,
    selectedAlgorithm,
    targetParameterSetup,
    fixedParameters,
    environmentSetup,
    multipleRunsSetup,
    metricsConfig,
    isRunning,
    error,
}: RunTabContentProps) {
    const { setIsRunning, setError } = useParameterBenchmarkModalStore();

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Summary */}
            <div className="p-3 bg-gray-50 border border-gray-300 rounded">
                <div className="text-sm font-medium text-gray-700 mb-2">Benchmark Configuration</div>
                <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Provider:</strong> {selectedProvider?.name}</div>
                    <div><strong>Algorithm:</strong> {selectedAlgorithm?.name}</div>
                    <div><strong>Target Parameter:</strong> Varying</div>
                    <div><strong>Environment:</strong> {environmentSetup.width}×{environmentSetup.height} cells, {environmentSetup.cellSize} cell size</div>
                    <div><strong>Runs per Step:</strong> {multipleRunsSetup.runsPerStep}</div>
                    <div><strong>Aggregate Method:</strong> {multipleRunsSetup.stepValueCalculation}</div>
                    <div>
                        <strong>Tracked Metrics:</strong> {
                            Array.from(metricsConfig.selectedMetrics as Set<BenchmarkMetricType>)
                                .map((metric: BenchmarkMetricType) => {
                                    const labels: Record<BenchmarkMetricType, string> = {
                                        coverage: "Coverage Ratio",
                                        overlap: "Overlap Ratio",
                                        efficiency: "Efficiency",
                                        turns: "Number of Turns",
                                        pathLength: "Path Length",
                                    };
                                    return labels[metric];
                                })
                                .join(", ")
                        }
                    </div>
                </div>
            </div>

            {/* Status */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="text-sm font-medium text-red-900">Error</div>
                    <div className="text-xs text-red-700 mt-1">{error}</div>
                </div>
            )}

            {isRunning && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <div className="text-sm text-blue-900">Running benchmarks...</div>
                </div>
            )}

            {/* Run Button */}
            <button
                type="button"
                onClick={() => runBenchmark(selectedProvider, selectedAlgorithm, targetParameterSetup, fixedParameters, environmentSetup, setIsRunning, setError)}
                disabled={isRunning}
                className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors ${isRunning
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 active:bg-teal-800"
                    }`}
            >
                {isRunning ? "Running..." : "Start Benchmark"}
            </button>

            {/* Results Placeholder */}
            <div className="text-center text-sm text-gray-500 py-8">
                Benchmark results will appear here
            </div>
        </div>
    );
}

// ─── Benchmark Runner ─────────────────────────────────────────────────────────

async function runBenchmark(
    selectedProvider: ComputationProvider | undefined,
    selectedAlgorithm: ComputationAlgorithm | undefined,
    targetParameterSetup: any,
    fixedParameters: any[],
    environmentSetup: any,
    setIsRunning: any,
    setError: any,
) {
    if (!selectedProvider || !selectedAlgorithm || !targetParameterSetup) return;

    setIsRunning(true);
    setError(null);

    try {
        // TODO: Implement actual benchmark execution
        // This will involve:
        // 1. Generating environments
        // 2. Running computations with varying parameters
        // 3. Collecting metrics
        // 4. Plotting results

        console.log("Benchmark started", {
            provider: selectedProvider,
            algorithm: selectedAlgorithm,
            targetParameter: targetParameterSetup,
            fixedParameters,
            environmentSetup,
        });

        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setError("Benchmark runner not yet fully implemented");
    } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
        setIsRunning(false);
    }
}
