import { afterEach, describe, expect, test } from "bun:test";
import type {
    BenchmarkEnvironmentSetup,
    BenchmarkFixedParameter,
    BenchmarkMultipleRunsSetup,
    BenchmarkParameterSetup,
    BenchmarkSystemEnvironmentSetup,
} from "@/features/performance-monitor/stores/parameterBenchmarkModalStore";
import type {
    AlgorithmMetric,
    AlgorithmParameter,
    ComputationAlgorithm,
    ComputationProvider,
} from "@/types/serviceTypes";

const originalFetch = globalThis.fetch;

if (!("localStorage" in globalThis)) {
    const storage = new Map<string, string>();
    const localStorageMock = {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
            storage.set(key, value);
        },
        removeItem: (key: string) => {
            storage.delete(key);
        },
        clear: () => {
            storage.clear();
        },
        key: (index: number) => Array.from(storage.keys())[index] ?? null,
        get length() {
            return storage.size;
        },
    } satisfies Storage;

    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        writable: true,
        value: localStorageMock,
    });
}

afterEach(() => {
    globalThis.fetch = originalFetch;
});

function makeProvider(): ComputationProvider {
    return {
        id: 1,
        name: "Test Provider",
        url: "http://localhost:8080",
        apiKey: "",
        metadataFetchedAt: null,
        urlAtLastFetch: null,
    };
}

function makeAlgorithm(): ComputationAlgorithm {
    return {
        id: 1,
        computationProviderId: 1,
        name: "Test Algo",
    };
}

function makeTargetSetup(): BenchmarkParameterSetup {
    return {
        targetParamId: 10,
        startValue: "1",
        endValue: "1",
        stepValue: "1",
    };
}

function makeEnvironmentSetup(): BenchmarkEnvironmentSetup {
    return {
        width: 100,
        height: 100,
        cellSize: 10,
        obstacleRatio: 20,
        clusteringProb: 50,
        seed: "benchmark-test-seed",
    };
}

function makeSystemEnvironmentSetup(): BenchmarkSystemEnvironmentSetup {
    return {
        format: "polygon",
        type: "any_offline",
        coordinateSystem: "Cartesian",
        headland: true,
        headlandWidth: "10",
    };
}

function makeMultipleRunsSetup(runsPerStep = 1): BenchmarkMultipleRunsSetup {
    return {
        runsPerStep,
        stepValueCalculation: "median",
    };
}

function makeParams(): AlgorithmParameter[] {
    return [
        {
            id: 10,
            algorithmId: 1,
            computationProviderId: 1,
            name: "Path Width",
            paramType: "Decimal",
            enumValues: [],
            defaultValue: "1",
            appHandler: null,
        },
    ];
}

function makeMetrics(): AlgorithmMetric[] {
    return [
        {
            id: 900,
            algorithmId: 1,
            computationProviderId: 1,
            name: "Coverage Ratio",
            type: "Single-value",
        },
    ];
}

function makeCompletedState(coverageValue: number) {
    return {
        jobId: "job-1",
        status: "completed",
        algorithmName: "Test Algo",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        result: {
            coveragePathPlan: {
                segments: [
                    {
                        id: 1,
                        type: "coverage",
                        path: [
                            { id: 1, point: { x: 0, y: 0 } },
                            { id: 2, point: { x: 10, y: 0 } },
                        ],
                    },
                ],
            },
            performance: {
                metrics: [{ id: 900, value: coverageValue }],
            },
        },
    };
}

async function resetSystemEnvParameters() {
    const { useEnvStore } = await import("@/stores/envStore");
    const env = useEnvStore.getState().env;

    useEnvStore.getState().setEnv({
        ...env,
        format: "polygon",
        type: "any_offline",
        coordSystem: "Cartesian",
        headlandEnabled: true,
        headlandWidth: "10",
    });
}

describe("runBenchmark", () => {
    test("executes one step and aggregates selected metric", async () => {
        const { runBenchmark } = await import("@/features/performance-monitor/data/benchmarkRunnerService");
        await resetSystemEnvParameters();

        let submittedBody: Record<string, any> | null = null;

        const fetchMock = async (input: string | URL, init?: RequestInit): Promise<Response> => {
            const url = String(input);
            if (url.endsWith("/compute")) {
                submittedBody = JSON.parse(String(init?.body ?? "{}"));
                return new Response(
                    JSON.stringify({
                        jobId: "job-1",
                        pollUrl: "http://localhost:8080/compute/job-1",
                    }),
                    { status: 202 },
                );
            }

            return new Response(JSON.stringify(makeCompletedState(0.75)), { status: 200 });
        };

        globalThis.fetch = fetchMock as typeof fetch;

        const results = await runBenchmark({
            provider: makeProvider(),
            algorithm: makeAlgorithm(),
            algorithmParameters: makeParams(),
            algorithmMetrics: makeMetrics(),
            targetParameterSetup: makeTargetSetup(),
            fixedParameters: [] as BenchmarkFixedParameter[],
            environmentSetup: makeEnvironmentSetup(),
            systemEnvironmentSetup: makeSystemEnvironmentSetup(),
            multipleRunsSetup: makeMultipleRunsSetup(1),
            selectedMetrics: new Set(["coverage"]),
        });

        expect(results).toHaveLength(1);
        expect(results[0]?.runsCompleted).toBe(1);
        expect(results[0]?.runsFailed).toBe(0);
        expect(results[0]?.aggregatedMetrics.coverage.median).toBe(0.75);
        expect(results[0]?.aggregatedMetrics.coverage.average).toBe(0.75);
        expect(results[0]?.aggregatedMetrics.turns.median).toBeNull();

        if (!submittedBody) {
            throw new Error("Expected benchmark request body to be captured.");
        }

        const body = submittedBody as Record<string, any>;
        expect(body.algorithmId).toBe(1);
        expect(body.parameters?.["Path Width"]).toBe(1);
        expect(body.parameters?.["Format"]).toBe("Polygon");
        expect(body.parameters?.["Type"]).toBe("Any (default: Off-Line)");
        expect(body.parameters?.["Coordinate System"]).toBe("Cartesian");
        expect(body.parameters?.["Headland"]).toBeTrue();
        expect(body.parameters?.["Headland Width"]).toBe("10");
    });

    test("continues to next run when one run fails", async () => {
        const { runBenchmark } = await import("@/features/performance-monitor/data/benchmarkRunnerService");
        await resetSystemEnvParameters();

        let call = 0;

        const fetchMock = async (input: string | URL): Promise<Response> => {
            const url = String(input);
            if (url.endsWith("/compute")) {
                call += 1;
                return new Response(
                    JSON.stringify({
                        jobId: `job-${call}`,
                        pollUrl: `http://localhost:8080/compute/job-${call}`,
                    }),
                    { status: 202 },
                );
            }

            if (url.endsWith("/compute/job-1")) {
                return new Response(
                    JSON.stringify({
                        jobId: "job-1",
                        status: "failed",
                        algorithmName: "Test Algo",
                        createdAt: new Date().toISOString(),
                        completedAt: new Date().toISOString(),
                        error: { code: "test_failed", message: "forced failure" },
                    }),
                    { status: 200 },
                );
            }

            return new Response(JSON.stringify(makeCompletedState(0.5)), { status: 200 });
        };

        globalThis.fetch = fetchMock as typeof fetch;

        const results = await runBenchmark({
            provider: makeProvider(),
            algorithm: makeAlgorithm(),
            algorithmParameters: makeParams(),
            algorithmMetrics: makeMetrics(),
            targetParameterSetup: makeTargetSetup(),
            fixedParameters: [] as BenchmarkFixedParameter[],
            environmentSetup: makeEnvironmentSetup(),
            systemEnvironmentSetup: makeSystemEnvironmentSetup(),
            multipleRunsSetup: makeMultipleRunsSetup(2),
            selectedMetrics: new Set(["coverage"]),
        });

        expect(results).toHaveLength(1);
        expect(results[0]?.runsCompleted).toBe(1);
        expect(results[0]?.runsFailed).toBe(1);
        expect(results[0]?.aggregatedMetrics.coverage.median).toBe(0.5);
        expect(results[0]?.rawRuns).toHaveLength(2);
        expect(results[0]?.rawRuns.some((run) => run.status === "failed")).toBeTrue();
        expect(results[0]?.rawRuns.some((run) => run.status === "completed")).toBeTrue();
    });
});
