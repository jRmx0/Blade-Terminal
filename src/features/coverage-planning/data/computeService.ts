import { OBJECT_CATEGORY } from "@/config/db-ops/enums";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { buildComputationProviderEndpointUrl } from "@/features/computation-provider/utils/computationProviderUrl";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useEnvStore } from "@/stores/envStore";
import { useParameterValuesStore } from "@/stores/parameterValuesStore";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import { saveComputeResult } from "@server/db/computeResults";
import type { AlgoParamType, ComputeJobState, ComputeJobStateCompleted } from "@/types/serviceTypes";
import type { ComputeResultRecord } from "@/types/schemaTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComputeSubmitResult =
    | { ok: true; jobId: string; pollUrl: string }
    | { ok: false; error: string };

export type ComputeExecuteResult =
    | { ok: true; record: ComputeResultRecord }
    | { ok: false; error: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildHeaders(apiKey: string): HeadersInit {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (apiKey.trim() !== "") {
        headers["Authorization"] = `Bearer ${apiKey}`;
    }
    return headers;
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

// ─── Service ─────────────────────────────────────────────────────────────────

export async function submitComputeRequest(): Promise<ComputeSubmitResult> {
    const { computation } = useEnvStore.getState();
    const { selectedProviderId, selectedAlgorithmId } = computation;

    if (selectedProviderId === null) {
        return { ok: false, error: "No computation provider selected." };
    }
    if (selectedAlgorithmId === null) {
        return { ok: false, error: "No algorithm selected." };
    }

    const { providers, algorithms, parameters: catalogParameters } = useComputationCatalogStore.getState();

    const provider = providers.find((p) => p.id === selectedProviderId);
    if (!provider) {
        return { ok: false, error: "Selected provider not found in catalog." };
    }

    const builtUrl = buildComputationProviderEndpointUrl(provider.url, "/compute");
    if (!builtUrl.ok) {
        return { ok: false, error: `Provider URL is invalid: ${builtUrl.error}` };
    }

    const algorithm = algorithms.find(
        (a) => a.id === selectedAlgorithmId && a.computationProviderId === selectedProviderId,
    );
    if (!algorithm) {
        return { ok: false, error: "Selected algorithm not found in catalog." };
    }

    const algoParams = catalogParameters.filter(
        (p) => p.algorithmId === selectedAlgorithmId && p.computationProviderId === selectedProviderId,
    );

    const { parameterValues } = useParameterValuesStore.getState();

    const parameters: Record<string, number | boolean | string> = {};
    for (const param of algoParams) {
        const pv = parameterValues.find(
            (v) =>
                v.id === param.id &&
                v.algorithmId === param.algorithmId &&
                v.providerId === param.computationProviderId,
        );
        if (pv === undefined) {
            return { ok: false, error: `Missing parameter value for "${param.name}".` };
        }
        parameters[param.name] = coerceParamValue(pv.value, param.paramType);
    }

    const { objects } = useCanvasObjectStore.getState();

    const zoneObjects = objects.filter((o) => o.category === OBJECT_CATEGORY.ZONE);
    const obstacleObjects = objects.filter((o) => o.category === OBJECT_CATEGORY.OBSTACLE);

    if (zoneObjects.length === 0) {
        return { ok: false, error: "No zone drawn on canvas." };
    }

    const zones = zoneObjects.map((o) => ({
        vertices: o.vertices.map(({ x, y }) => ({ x, y })),
    }));
    const obstacles = obstacleObjects.map((o) => ({
        vertices: o.vertices.map(({ x, y }) => ({ x, y })),
    }));

    const requestBody = {
        algorithmId: selectedAlgorithmId,
        environment: { zones, obstacles },
        parameters,
    };

    try {
        const response = await fetch(builtUrl.url, {
            method: "POST",
            headers: buildHeaders(provider.apiKey),
            body: JSON.stringify(requestBody),
        });

        const data = await response.json() as Record<string, unknown>;

        if (response.status === 202) {
            return {
                ok: true,
                jobId: data["jobId"] as string,
                pollUrl: data["pollUrl"] as string,
            };
        }

        const errorBody = data["error"] as { message?: string } | undefined;
        return {
            ok: false,
            error: errorBody?.message ?? `Unexpected response status ${response.status}.`,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: `Request failed: ${message}` };
    }
}

// ─── Polling ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 600;
const POLL_MAX_ATTEMPTS = 100; // 60 s

async function pollComputeJob(pollUrl: string, apiKey: string): Promise<ComputeJobState> {
    const headers: HeadersInit = apiKey.trim() !== "" ? { "Authorization": `Bearer ${apiKey}` } : {};
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
        await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        const response = await fetch(pollUrl, { headers });
        const data = await response.json() as ComputeJobState;
        if (data.status === "completed" || data.status === "failed") {
            return data;
        }
    }
    throw new Error("Compute job timed out after 60 seconds.");
}

// ─── Execute (submit + poll + persist) ───────────────────────────────────────

export async function executeComputeRequest(): Promise<ComputeExecuteResult> {
    const resultStore = useComputeResultStore.getState();
    resultStore.setStatus("submitting");

    const submitResult = await submitComputeRequest();
    if (!submitResult.ok) {
        resultStore.setStatus("idle");
        return { ok: false, error: submitResult.error };
    }

    resultStore.setStatus("polling");

    const { computation } = useEnvStore.getState();
    const { providers } = useComputationCatalogStore.getState();
    const provider = providers.find((p) => p.id === computation.selectedProviderId);
    const apiKey = provider?.apiKey ?? "";

    let jobState: ComputeJobState;
    try {
        jobState = await pollComputeJob(submitResult.pollUrl, apiKey);
    } catch (err) {
        resultStore.setStatus("failed");
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
    }

    if (jobState.status === "failed") {
        resultStore.setStatus("failed");
        return { ok: false, error: jobState.error?.message ?? "Compute job failed." };
    }

    const completed = jobState as ComputeJobStateCompleted;
    const { env } = useEnvStore.getState();
    const record: ComputeResultRecord = {
        environmentId: env.id,
        jobId: completed.jobId,
        algorithmId: computation.selectedAlgorithmId!,
        providerId: computation.selectedProviderId!,
        algorithmName: completed.algorithmName,
        completedAt: completed.completedAt ?? new Date().toISOString(),
        result: completed.result,
    };

    await saveComputeResult(record);
    resultStore.setResult(record);

    return { ok: true, record };
}
