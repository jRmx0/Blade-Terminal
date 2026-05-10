import { create } from "zustand";

export interface BenchmarkParameterSetup {
    /** Parameter ID to vary */
    targetParamId: number;
    /** Start value (as string, will be coerced) */
    startValue: string;
    /** End value (as string, will be coerced) */
    endValue: string;
    /** Step size (as string, will be coerced) */
    stepValue: string;
}

export interface BenchmarkFixedParameter {
    paramId: number;
    value: string;
}

export interface BenchmarkEnvironmentSetup {
    /** Width of generated environment */
    width: number;
    /** Height of generated environment */
    height: number;
    /** Cell size for grid generation */
    cellSize: number;
    /** Obstacle ratio (0-100) */
    obstacleRatio: number;
    /** Clustering probability (0-100) */
    clusteringProb: number;
    /** Random seed (empty = randomize each time) */
    seed: string;
}

export type BenchmarkStepValueCalculation = "median" | "average";

export type BenchmarkMetricType = "coverage" | "overlap" | "efficiency" | "turns" | "pathLength";

export interface BenchmarkMetricsConfig {
    /** Set of metrics to track during benchmark */
    selectedMetrics: Set<BenchmarkMetricType>;
}

export interface BenchmarkMultipleRunsSetup {
    /** Number of runs to execute for each step value */
    runsPerStep: number;
    /** How to aggregate metric values from multiple runs */
    stepValueCalculation: BenchmarkStepValueCalculation;
}

// ─── Execution & Results ───────────────────────────────────────────────────

export interface BenchmarkMetricsValues {
    coverage: number | null;
    overlap: number | null;
    efficiency: number | null;
    turns: number | null;
    pathLength: number | null;
}

export type BenchmarkRunStatus = "queued" | "running" | "completed" | "failed" | "skipped";

export interface BenchmarkRun {
    /** Parameter value being tested */
    stepValue: number;
    /** Which run this is for this step (0-indexed) */
    runIndex: number;
    /** Current status of this run */
    status: BenchmarkRunStatus;
    /** Extracted metrics from computation result */
    metrics?: BenchmarkMetricsValues;
    /** Job ID from provider API */
    jobId?: string;
    /** Error message if failed/skipped */
    error?: string;
    /** When computation completed */
    completedAt?: string;
}

export interface BenchmarkAggregatedMetrics {
    /** Each metric has median and average calculated from all completed runs */
    coverage: { median: number | null; average: number | null };
    overlap: { median: number | null; average: number | null };
    efficiency: { median: number | null; average: number | null };
    turns: { median: number | null; average: number | null };
    pathLength: { median: number | null; average: number | null };
}

export interface BenchmarkStepResult {
    /** The parameter value for this step */
    stepValue: number;
    /** Number of runs that completed successfully */
    runsCompleted: number;
    /** Number of runs that failed/timed out */
    runsFailed: number;
    /** Aggregated metrics (median and average) */
    aggregatedMetrics: BenchmarkAggregatedMetrics;
    /** Raw run data for detail inspection */
    rawRuns: BenchmarkRun[];
}

export type BenchmarkExecutionStatus = "idle" | "running" | "completed" | "error" | "cancelled";

export interface BenchmarkProgress {
    /** Total number of steps to execute */
    totalSteps: number;
    /** Number of steps completed so far */
    completedSteps: number;
    /** Total number of runs (steps × runsPerStep) */
    totalRuns: number;
    /** Number of runs completed (including failed) */
    completedRuns: number;
    /** Current step value being executed */
    currentStepValue?: number;
    /** Current run index (0-indexed within step) */
    currentRunIndex?: number;
}

export interface BenchmarkExecutionState {
    /** Current execution status */
    status: BenchmarkExecutionStatus;
    /** Progress tracking */
    progress: BenchmarkProgress;
    /** All completed step results so far */
    results: BenchmarkStepResult[];
    /** AbortController signal for cancellation */
    abortSignal?: AbortSignal;
    /** Error message if execution failed */
    error?: string;
}

interface ParameterBenchmarkModalState {
    isOpen: boolean;
    selectedProviderId: number | null;
    selectedAlgorithmId: number | null;
    targetParameterSetup: BenchmarkParameterSetup | null;
    fixedParameters: BenchmarkFixedParameter[];
    environmentSetup: BenchmarkEnvironmentSetup;
    multipleRunsSetup: BenchmarkMultipleRunsSetup;
    metricsConfig: BenchmarkMetricsConfig;
    isRunning: boolean;
    error: string | null;

    // Execution & Results
    executionState: BenchmarkExecutionState;

    open: () => void;
    close: () => void;
    setSelectedProvider: (providerId: number) => void;
    setSelectedAlgorithm: (algorithmId: number) => void;
    setTargetParameterSetup: (setup: BenchmarkParameterSetup) => void;
    setFixedParameter: (paramId: number, value: string) => void;
    removeFixedParameter: (paramId: number) => void;
    setEnvironmentSetup: (setup: Partial<BenchmarkEnvironmentSetup>) => void;
    setMultipleRunsSetup: (setup: Partial<BenchmarkMultipleRunsSetup>) => void;
    toggleMetric: (metric: BenchmarkMetricType) => void;
    setMetrics: (metrics: BenchmarkMetricType[]) => void;
    setIsRunning: (running: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;

    // Execution management
    setBenchmarkExecutionState: (state: Partial<BenchmarkExecutionState>) => void;
    addStepResult: (result: BenchmarkStepResult) => void;
    updateRunProgress: (stepValue: number, runIndex: number, updates: Partial<BenchmarkRun>) => void;
    cancelBenchmark: () => void;
    resetResults: () => void;
}

const INITIAL_EXECUTION_STATE: BenchmarkExecutionState = {
    status: "idle",
    progress: {
        totalSteps: 0,
        completedSteps: 0,
        totalRuns: 0,
        completedRuns: 0,
    },
    results: [],
};

export function calculateAggregateMetrics(values: Array<number | null>): { median: number | null; average: number | null } {
    const validValues = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    if (validValues.length === 0) {
        return { median: null, average: null };
    }

    const sorted = [...validValues].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
        ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
        : (sorted[mid] ?? null);
    const average = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;

    return { median, average };
}

const INITIAL_STATE: Omit<ParameterBenchmarkModalState, keyof {
    open: () => void;
    close: () => void;
    setSelectedProvider: () => void;
    setSelectedAlgorithm: () => void;
    setTargetParameterSetup: () => void;
    setFixedParameter: () => void;
    removeFixedParameter: () => void;
    setEnvironmentSetup: () => void;
    setMultipleRunsSetup: () => void;
    toggleMetric: () => void;
    setMetrics: () => void;
    setIsRunning: () => void;
    setError: () => void;
    reset: () => void;
    setBenchmarkExecutionState: () => void;
    addStepResult: () => void;
    updateRunProgress: () => void;
    cancelBenchmark: () => void;
    resetResults: () => void;
}> = {
    isOpen: false,
    selectedProviderId: null,
    selectedAlgorithmId: null,
    targetParameterSetup: null,
    fixedParameters: [],
    environmentSetup: {
        width: 1000,
        height: 1000,
        cellSize: 5,
        obstacleRatio: 25,
        clusteringProb: 50,
        seed: "",
    },
    multipleRunsSetup: {
        runsPerStep: 3,
        stepValueCalculation: "median",
    },
    metricsConfig: {
        selectedMetrics: new Set(["coverage", "overlap", "efficiency", "turns", "pathLength"] as BenchmarkMetricType[]),
    },
    isRunning: false,
    error: null,
    executionState: INITIAL_EXECUTION_STATE,
};

export const useParameterBenchmarkModalStore = create<ParameterBenchmarkModalState>()((set, get) => ({
    ...INITIAL_STATE,

    open: () => set({ isOpen: true }),

    close: () => set({ isOpen: false }),

    setSelectedProvider: (providerId) => set({ selectedProviderId: providerId, selectedAlgorithmId: null }),

    setSelectedAlgorithm: (algorithmId) => set({ selectedAlgorithmId: algorithmId }),

    setTargetParameterSetup: (setup) => set({ targetParameterSetup: setup }),

    setFixedParameter: (paramId, value) => {
        set((state) => {
            const existing = state.fixedParameters.find((p) => p.paramId === paramId);
            if (existing) {
                return {
                    fixedParameters: state.fixedParameters.map((p) =>
                        p.paramId === paramId ? { paramId, value } : p,
                    ),
                };
            }
            return {
                fixedParameters: [...state.fixedParameters, { paramId, value }],
            };
        });
    },

    removeFixedParameter: (paramId) => {
        set((state) => ({
            fixedParameters: state.fixedParameters.filter((p) => p.paramId !== paramId),
        }));
    },

    setEnvironmentSetup: (setup) => {
        set((state) => ({
            environmentSetup: { ...state.environmentSetup, ...setup },
        }));
    },

    setMultipleRunsSetup: (setup) => {
        set((state) => ({
            multipleRunsSetup: { ...state.multipleRunsSetup, ...setup },
        }));
    },

    toggleMetric: (metric) => {
        set((state) => {
            const newMetrics = new Set(state.metricsConfig.selectedMetrics);
            if (newMetrics.has(metric)) {
                newMetrics.delete(metric);
            } else {
                newMetrics.add(metric);
            }
            return {
                metricsConfig: { selectedMetrics: newMetrics },
            };
        });
    },

    setMetrics: (metrics) => {
        set({
            metricsConfig: { selectedMetrics: new Set(metrics) },
        });
    },

    setIsRunning: (running) => set({ isRunning: running }),

    setError: (error) => set({ error }),

    reset: () => set(INITIAL_STATE),

    setBenchmarkExecutionState: (executionPatch) => {
        set((state) => ({
            executionState: {
                ...state.executionState,
                ...executionPatch,
                progress: {
                    ...state.executionState.progress,
                    ...(executionPatch.progress ?? {}),
                },
                results: executionPatch.results ?? state.executionState.results,
            },
        }));
    },

    addStepResult: (result) => {
        set((state) => {
            const nextResults = [...state.executionState.results, result];
            return {
                executionState: {
                    ...state.executionState,
                    results: nextResults,
                    progress: {
                        ...state.executionState.progress,
                        completedSteps: nextResults.length,
                    },
                },
            };
        });
    },

    updateRunProgress: (stepValue, runIndex, updates) => {
        set((state) => {
            const nextResults = state.executionState.results.map((stepResult) => {
                if (stepResult.stepValue !== stepValue) return stepResult;

                if (runIndex < 0 || runIndex >= stepResult.rawRuns.length) return stepResult;

                const nextRawRuns = [...stepResult.rawRuns];
                const baseRun = nextRawRuns[runIndex];
                if (!baseRun) return stepResult;

                nextRawRuns[runIndex] = {
                    stepValue: baseRun.stepValue,
                    runIndex: baseRun.runIndex,
                    status: updates.status ?? baseRun.status,
                    metrics: updates.metrics ?? baseRun.metrics,
                    jobId: updates.jobId ?? baseRun.jobId,
                    error: updates.error ?? baseRun.error,
                    completedAt: updates.completedAt ?? baseRun.completedAt,
                };

                return {
                    ...stepResult,
                    rawRuns: nextRawRuns,
                };
            });

            return {
                executionState: {
                    ...state.executionState,
                    results: nextResults,
                    progress: {
                        ...state.executionState.progress,
                        completedRuns: Math.min(
                            state.executionState.progress.totalRuns,
                            state.executionState.progress.completedRuns + 1,
                        ),
                    },
                },
            };
        });
    },

    cancelBenchmark: () => {
        set((state) => ({
            isRunning: false,
            executionState: {
                ...state.executionState,
                status: "cancelled",
                abortSignal: undefined,
            },
        }));
    },

    resetResults: () => {
        set((state) => ({
            executionState: {
                ...INITIAL_EXECUTION_STATE,
                results: [],
            },
            error: null,
            isRunning: state.isRunning,
        }));
    },
}));
