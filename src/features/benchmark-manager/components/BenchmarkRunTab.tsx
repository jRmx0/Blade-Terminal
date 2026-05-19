import { useMemo } from "react";
import {
    ENV_FORMAT_OPTIONS,
    ENV_TYPE_OPTIONS,
} from "@/config/db-ops/enums";
import ChartCard from "@/components/chart/ChartCard";
import {
    type BenchmarkEnvironmentSetup,
    type BenchmarkExecutionState,
    type BenchmarkFixedParameter,
    type BenchmarkMetricType,
    type BenchmarkMultipleRunsSetup,
    type BenchmarkParameterSetup,
    type BenchmarkSystemEnvironmentSetup,
} from "@/features/benchmark-manager/stores/benchmarkModalStore";
import type { ComputationAlgorithm, ComputationProvider } from "@/types/serviceTypes";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BenchmarkRunTabProps {
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function BenchmarkRunTab({
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
}: BenchmarkRunTabProps) {
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
        const labels: Record<BenchmarkMetricType, string> = {
            coverage: "Coverage Ratio",
            overlap: "Overlap Ratio",
            efficiency: "Efficiency",
            turns: "Number of Turns",
            pathLength: "Path Length",
        };

        return selectedMetrics.map((metric, idx) => ({
            metric,
            metricId: 10000 + idx,
            name: `${labels[metric]} vs ${targetParameterName}`,
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
                    <div><strong>Environment:</strong> {environmentSetup.width}×{environmentSetup.height} cells, {environmentSetup.cellSize} cell size</div>
                    <div><strong>Runs per Step:</strong> {multipleRunsSetup.runsPerStep}</div>
                    <div><strong>Aggregate Method:</strong> {multipleRunsSetup.stepValueCalculation}</div>
                    <div><strong>Format:</strong> {ENV_FORMAT_OPTIONS.find((x) => x.value === systemEnvironmentSetup.format)?.label ?? systemEnvironmentSetup.format}</div>
                    <div><strong>Type:</strong> {ENV_TYPE_OPTIONS.find((x) => x.value === systemEnvironmentSetup.type)?.label ?? systemEnvironmentSetup.type}</div>
                    <div><strong>Coordinate System:</strong> {systemEnvironmentSetup.coordinateSystem}</div>
                    <div><strong>Headland:</strong> {systemEnvironmentSetup.headland ? "Enabled" : "Disabled"}</div>
                    <div><strong>Headland Width:</strong> {systemEnvironmentSetup.headlandWidth}</div>
                    <div>
                        <strong>Tracked Metrics:</strong> {selectedMetrics.map((m) => metricLabels[m]).join(", ")}
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-700">
                    <span>
                        Progress: {executionState.progress.completedSteps}/{executionState.progress.totalSteps} steps · {executionState.progress.completedRuns}/{executionState.progress.totalRuns} runs
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
                                                    {typeof aggregate === "number" ? aggregate.toFixed(3) : "—"}
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
