import { generateEnvironment } from "@/features/canvas-editing/utils/envGenerator";
import { buildComputationProviderEndpointUrl } from "@/features/computation-provider/utils/computationProviderUrl";
import {
    calculateAggregateMetrics,
    type BenchmarkAggregatedMetrics,
    type BenchmarkEnvironmentSetup,
    type BenchmarkFixedParameter,
    type BenchmarkMetricType,
    type BenchmarkMetricsValues,
    type BenchmarkMultipleRunsSetup,
    type BenchmarkParameterSetup,
    type BenchmarkRun,
    type BenchmarkStepResult,
} from "@/features/performance-monitor/stores/parameterBenchmarkModalStore";
import { computeNumberOfTurns, computePathLength } from "@/utils/coverageGrid";
import type {
    AlgoParamType,
    AlgorithmMetric,
    AlgorithmParameter,
    ComputationAlgorithm,
    ComputationProvider,
    ComputeJobState,
    ComputeJobStateCompleted,
    PerformanceMetric,
} from "@/types/serviceTypes";

export interface BenchmarkProgressUpdate {
    totalSteps: number;
    completedSteps: number;
    totalRuns: number;
    completedRuns: number;
    currentStepValue?: number;
    currentRunIndex?: number;
}

export interface RunBenchmarkConfig {
    provider: ComputationProvider;
    algorithm: ComputationAlgorithm;
    algorithmParameters: AlgorithmParameter[];
    algorithmMetrics: AlgorithmMetric[];
    targetParameterSetup: BenchmarkParameterSetup;
    fixedParameters: BenchmarkFixedParameter[];
    environmentSetup: BenchmarkEnvironmentSetup;
    multipleRunsSetup: BenchmarkMultipleRunsSetup;
    selectedMetrics: Set<BenchmarkMetricType>;
    signal?: AbortSignal;
    onProgress?: (progress: BenchmarkProgressUpdate) => void;
    onRunUpdate?: (stepValue: number, runIndex: number, updates: Partial<BenchmarkRun>) => void;
    onStepCompleted?: (result: BenchmarkStepResult) => void;
}

interface ComputeSubmitResult {
    ok: boolean;
    jobId?: string;
    pollUrl?: string;
    error?: string;
}

const POLL_INTERVAL_MS = 600;
const POLL_MAX_ATTEMPTS = 100;

function buildHeaders(apiKey: string): HeadersInit {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (apiKey.trim() !== "") {
        headers.Authorization = `Bearer ${apiKey}`;
    }

    return headers;
}

function isNumericParameter(paramType: AlgoParamType): boolean {
    return paramType === "Integer" || paramType === "Decimal";
}

function isNullableParameter(paramName: string, paramType: AlgoParamType): boolean {
    return paramType === "String" && paramName === "Seed";
}

function coerceParamValue(raw: string, paramType: AlgoParamType): number | boolean | string {
    switch (paramType) {
        case "Integer":
        case "Decimal":
            return Number(raw);
        case "Boolean":
            return raw === "true";
        default:
            return raw;
    }
}

function buildStepValues(setup: BenchmarkParameterSetup): number[] {
    const start = Number(setup.startValue);
    const end = Number(setup.endValue);
    const step = Number(setup.stepValue);

    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0) {
        return [];
    }

    const values: number[] = [];
    for (let value = start; value <= end; value += step) {
        values.push(Number(value.toFixed(8)));
    }

    if (values.length === 0 || values[values.length - 1] !== end) {
        values.push(end);
    }

    return values;
}

function buildParametersForStep(
    algorithmParameters: AlgorithmParameter[],
    fixedParameters: BenchmarkFixedParameter[],
    targetParameterSetup: BenchmarkParameterSetup,
    stepValue: number,
): Record<string, number | boolean | string | null> {
    const fixedById = new Map<number, string>();
    for (const fixed of fixedParameters) {
        fixedById.set(fixed.paramId, fixed.value);
    }

    const parameters: Record<string, number | boolean | string | null> = {};

    for (const param of algorithmParameters) {
        const rawValue =
            param.id === targetParameterSetup.targetParamId
                ? String(stepValue)
                : fixedById.get(param.id) ?? param.defaultValue;

        if (rawValue.trim() === "" && (isNullableParameter(param.name, param.paramType) || isNumericParameter(param.paramType))) {
            parameters[param.name] = null;
            continue;
        }

        parameters[param.name] = coerceParamValue(rawValue, param.paramType);
    }

    return parameters;
}

async function submitComputeRequest(
    provider: ComputationProvider,
    algorithmId: number,
    body: unknown,
    signal?: AbortSignal,
): Promise<ComputeSubmitResult> {
    const builtUrl = buildComputationProviderEndpointUrl(provider.url, "/compute");
    if (!builtUrl.ok) {
        return { ok: false, error: `Provider URL is invalid: ${builtUrl.error}` };
    }

    try {
        const response = await fetch(builtUrl.url, {
            method: "POST",
            headers: buildHeaders(provider.apiKey),
            body: JSON.stringify({ algorithmId, ...((body as Record<string, unknown>) ?? {}) }),
            signal,
        });

        const data = (await response.json()) as Record<string, unknown>;

        if (response.status === 202) {
            return {
                ok: true,
                jobId: data.jobId as string,
                pollUrl: data.pollUrl as string,
            };
        }

        const errorBody = data.error as { message?: string } | undefined;
        return {
            ok: false,
            error: errorBody?.message ?? `Unexpected response status ${response.status}.`,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, error: `Request failed: ${message}` };
    }
}

async function pollComputeJob(
    pollUrl: string,
    apiKey: string,
    signal?: AbortSignal,
): Promise<ComputeJobState> {
    const headers = apiKey.trim() ? { Authorization: `Bearer ${apiKey}` } : undefined;

    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
        if (signal?.aborted) {
            throw new Error("Benchmark execution cancelled.");
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

        const response = await fetch(pollUrl, { headers, signal });
        const data = (await response.json()) as ComputeJobState;

        if (data.status === "completed" || data.status === "failed") {
            return data;
        }
    }

    throw new Error("Compute job timed out after 60 seconds.");
}

function performanceMetricToNumber(metric: PerformanceMetric | undefined): number | null {
    if (!metric) return null;

    if (typeof metric.value === "number") {
        return Number.isFinite(metric.value) ? metric.value : null;
    }

    if (Array.isArray(metric.value)) {
        const last = metric.value[metric.value.length - 1];
        return typeof last === "number" && Number.isFinite(last) ? last : null;
    }

    return null;
}

function findMetricValueByName(
    algorithmMetrics: AlgorithmMetric[],
    resultMetrics: PerformanceMetric[] | undefined,
    candidates: string[],
): number | null {
    if (!resultMetrics || resultMetrics.length === 0) return null;

    const normalizedCandidates = candidates.map((name) => name.trim().toLowerCase());
    const meta = algorithmMetrics.find((metric) => {
        const metricName = metric.name.trim().toLowerCase();
        return normalizedCandidates.some((candidate) => metricName.includes(candidate));
    });

    if (!meta) return null;
    return performanceMetricToNumber(resultMetrics.find((metric) => metric.id === meta.id));
}

function extractRunMetrics(
    completed: ComputeJobStateCompleted,
    algorithmMetrics: AlgorithmMetric[],
): BenchmarkMetricsValues {
    const resultMetrics = completed.result.performance?.metrics;

    const turnsFallback = computeNumberOfTurns(completed.result.coveragePathPlan.segments);
    const pathLengthFallback = computePathLength(completed.result.coveragePathPlan.segments);

    const coverage = findMetricValueByName(algorithmMetrics, resultMetrics, ["coverage ratio", "coverage"]);
    const overlap = findMetricValueByName(algorithmMetrics, resultMetrics, ["overlap ratio", "overlap"]);
    const efficiency = findMetricValueByName(algorithmMetrics, resultMetrics, ["efficiency"]);

    const turns =
        findMetricValueByName(algorithmMetrics, resultMetrics, ["number of turns", "turns", "turn"]) ?? turnsFallback;

    const pathLength =
        findMetricValueByName(algorithmMetrics, resultMetrics, ["path length", "path"]) ?? pathLengthFallback;

    return {
        coverage,
        overlap,
        efficiency,
        turns,
        pathLength,
    };
}

function aggregateStepRuns(runs: BenchmarkRun[]): BenchmarkAggregatedMetrics {
    const successfulRuns = runs.filter((run) => run.status === "completed" && run.metrics);

    const coverageValues = successfulRuns.map((run) => run.metrics?.coverage ?? null);
    const overlapValues = successfulRuns.map((run) => run.metrics?.overlap ?? null);
    const efficiencyValues = successfulRuns.map((run) => run.metrics?.efficiency ?? null);
    const turnsValues = successfulRuns.map((run) => run.metrics?.turns ?? null);
    const pathLengthValues = successfulRuns.map((run) => run.metrics?.pathLength ?? null);

    return {
        coverage: calculateAggregateMetrics(coverageValues),
        overlap: calculateAggregateMetrics(overlapValues),
        efficiency: calculateAggregateMetrics(efficiencyValues),
        turns: calculateAggregateMetrics(turnsValues),
        pathLength: calculateAggregateMetrics(pathLengthValues),
    };
}

export async function runBenchmark(config: RunBenchmarkConfig): Promise<BenchmarkStepResult[]> {
    const {
        provider,
        algorithm,
        algorithmParameters,
        algorithmMetrics,
        targetParameterSetup,
        fixedParameters,
        environmentSetup,
        multipleRunsSetup,
        selectedMetrics,
        signal,
        onProgress,
        onRunUpdate,
        onStepCompleted,
    } = config;

    const stepValues = buildStepValues(targetParameterSetup);
    if (stepValues.length === 0) {
        throw new Error("Invalid target parameter range. No benchmark steps could be generated.");
    }

    const totalRuns = stepValues.length * multipleRunsSetup.runsPerStep;
    let completedRuns = 0;
    const stepResults: BenchmarkStepResult[] = [];

    onProgress?.({
        totalSteps: stepValues.length,
        completedSteps: 0,
        totalRuns,
        completedRuns,
    });

    for (let stepIndex = 0; stepIndex < stepValues.length; stepIndex += 1) {
        const stepValue = stepValues[stepIndex]!;

        if (signal?.aborted) {
            break;
        }

        const runs: BenchmarkRun[] = [];

        for (let runIndex = 0; runIndex < multipleRunsSetup.runsPerStep; runIndex += 1) {
            if (signal?.aborted) {
                break;
            }

            onProgress?.({
                totalSteps: stepValues.length,
                completedSteps: stepIndex,
                totalRuns,
                completedRuns,
                currentStepValue: stepValue,
                currentRunIndex: runIndex,
            });

            const runSeed = environmentSetup.seed.trim()
                ? `${environmentSetup.seed.trim()}-step-${stepValue}-run-${runIndex}`
                : "";

            const generated = generateEnvironment({
                width: environmentSetup.width,
                height: environmentSetup.height,
                cellSize: environmentSetup.cellSize,
                obstacleRatio: environmentSetup.obstacleRatio,
                clusteringProb: environmentSetup.clusteringProb,
                seed: runSeed,
            });

            const parameters = buildParametersForStep(
                algorithmParameters,
                fixedParameters,
                targetParameterSetup,
                stepValue,
            );

            const run: BenchmarkRun = {
                stepValue,
                runIndex,
                status: "running",
            };
            runs.push(run);

            onRunUpdate?.(stepValue, runIndex, { status: "running" });

            const submitResult = await submitComputeRequest(
                provider,
                algorithm.id,
                {
                    environment: {
                        zones: [generated.boundary],
                        obstacles: generated.obstacles,
                        startPoint: generated.startEndPoint,
                        endPoint: generated.startEndPoint,
                    },
                    parameters,
                },
                signal,
            );

            if (!submitResult.ok || !submitResult.pollUrl || !submitResult.jobId) {
                completedRuns += 1;
                const error = submitResult.error ?? "Failed to submit benchmark run.";
                run.status = "skipped";
                run.error = error;
                onRunUpdate?.(stepValue, runIndex, { status: "skipped", error });
                continue;
            }

            run.jobId = submitResult.jobId;
            onRunUpdate?.(stepValue, runIndex, { jobId: submitResult.jobId });

            try {
                const state = await pollComputeJob(submitResult.pollUrl, provider.apiKey, signal);

                if (state.status === "failed") {
                    completedRuns += 1;
                    const error = state.error.message;
                    run.status = "failed";
                    run.error = error;
                    run.completedAt = state.completedAt;
                    onRunUpdate?.(stepValue, runIndex, {
                        status: "failed",
                        error,
                        completedAt: state.completedAt,
                    });
                    continue;
                }

                const completed = state as ComputeJobStateCompleted;
                const metrics = extractRunMetrics(completed, algorithmMetrics);

                const filteredMetrics: BenchmarkMetricsValues = {
                    coverage: selectedMetrics.has("coverage") ? metrics.coverage : null,
                    overlap: selectedMetrics.has("overlap") ? metrics.overlap : null,
                    efficiency: selectedMetrics.has("efficiency") ? metrics.efficiency : null,
                    turns: selectedMetrics.has("turns") ? metrics.turns : null,
                    pathLength: selectedMetrics.has("pathLength") ? metrics.pathLength : null,
                };

                completedRuns += 1;
                run.status = "completed";
                run.metrics = filteredMetrics;
                run.completedAt = completed.completedAt;

                onRunUpdate?.(stepValue, runIndex, {
                    status: "completed",
                    metrics: filteredMetrics,
                    completedAt: completed.completedAt,
                });
            } catch (error) {
                completedRuns += 1;
                const message = error instanceof Error ? error.message : String(error);
                run.status = signal?.aborted ? "skipped" : "failed";
                run.error = message;
                onRunUpdate?.(stepValue, runIndex, {
                    status: run.status,
                    error: message,
                });
            }
        }

        const runsCompleted = runs.filter((run) => run.status === "completed").length;
        const runsFailed = runs.filter((run) => run.status === "failed" || run.status === "skipped").length;

        const stepResult: BenchmarkStepResult = {
            stepValue,
            runsCompleted,
            runsFailed,
            aggregatedMetrics: aggregateStepRuns(runs),
            rawRuns: runs,
        };

        stepResults.push(stepResult);
        onStepCompleted?.(stepResult);

        onProgress?.({
            totalSteps: stepValues.length,
            completedSteps: stepIndex + 1,
            totalRuns,
            completedRuns,
        });
    }

    return stepResults;
}
