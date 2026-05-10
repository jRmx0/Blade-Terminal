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
}));
