import type {
    ComputationProvider,
    MetadataResponse,
    TestConnectionResult,
    FetchMetadataResult,
    FetchMetadataPreviewResult,
    FetchedComputationMetadata,
} from "@/types/serviceTypes";
import { db } from "@server/db/db";
import { updateMetadataTimestamp } from "@server/db/computationProviders";

// ─── Request builder ──────────────────────────────────────────────────────────

function buildHeaders(apiKey: string): HeadersInit {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (apiKey.trim() !== "") {
        headers["Authorization"] = `Bearer ${apiKey}`;
    }
    return headers;
}

function buildFetchedMetadata(provider: ComputationProvider, data: MetadataResponse): FetchedComputationMetadata {
    const computationProviderId = provider.id ?? 0;

    return {
        metadataFetchedAt: Date.now(),
        urlAtLastFetch: provider.url.trim(),
        algorithms: data.algorithms.map((algorithmResponse, algorithmIndex) => {
            const algorithmId = algorithmIndex + 1;

            return {
                algorithm: {
                    id: algorithmId,
                    computationProviderId,
                    name: algorithmResponse.name,
                    label: algorithmResponse.label,
                },
                parameters: algorithmResponse.parameters.map((parameter, parameterIndex) => ({
                    id: parameterIndex + 1,
                    algorithmId,
                    computationProviderId,
                    name: parameter.name,
                    label: parameter.label,
                    paramType: parameter.paramType,
                    enumValues: parameter.enumValues ?? [],
                    defaultValue: parameter.defaultValue ?? "",
                })),
            };
        }),
    };
}

async function requestMetadata(provider: ComputationProvider): Promise<{ ok: true; data: MetadataResponse } | { ok: false; error: string }> {
    try {
        const url = provider.url.replace(/\/$/, "");
        const response = await fetch(`${url}/metadata`, {
            method: "GET",
            headers: buildHeaders(provider.apiKey),
            signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) {
            return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }

        return { ok: true, data: (await response.json()) as MetadataResponse };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
    }
}

export async function fetchMetadataPreview(provider: ComputationProvider): Promise<FetchMetadataPreviewResult> {
    const result = await requestMetadata(provider);
    if (!result.ok) {
        return result;
    }

    return {
        ok: true,
        algorithmCount: result.data.algorithms.length,
        metadata: buildFetchedMetadata(provider, result.data),
    };
}

export async function persistFetchedMetadata(
    providerId: number,
    metadata: FetchedComputationMetadata,
): Promise<void> {
    await db.transaction("rw", [
        db.table("computationAlgorithms"),
        db.table("computationAlgorithmParameters"),
    ], async () => {
        await db.table("computationAlgorithmParameters").where("computationProviderId").equals(providerId).delete();
        await db.table("computationAlgorithms").where("computationProviderId").equals(providerId).delete();

        const algorithms = metadata.algorithms.map(({ algorithm }) => ({
            ...algorithm,
            computationProviderId: providerId,
        }));
        const parameters = metadata.algorithms.flatMap(({ parameters }) =>
            parameters.map((parameter) => ({
                ...parameter,
                computationProviderId: providerId,
            })),
        );

        if (algorithms.length > 0) {
            await db.table("computationAlgorithms").bulkPut(algorithms);
        }

        if (parameters.length > 0) {
            await db.table("computationAlgorithmParameters").bulkPut(parameters);
        }
    });

    await updateMetadataTimestamp(providerId, metadata.urlAtLastFetch, metadata.metadataFetchedAt);
}

// ─── Test Connection ──────────────────────────────────────────────────────────

/**
 * Verifies reachability of the provider. Does not modify the DB.
 * Expects any 2xx response from GET <url>/health.
 */
export async function testConnection(provider: ComputationProvider): Promise<TestConnectionResult> {
    try {
        const url = provider.url.replace(/\/$/, "");
        const response = await fetch(`${url}/health`, {
            method: "GET",
            headers: buildHeaders(provider.apiKey),
            signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) {
            return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }
        return { ok: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
    }
}

// ─── Fetch Metadata ───────────────────────────────────────────────────────────

/**
 * Fetches algorithm metadata from GET <url>/metadata and saves it to DB.
 * Replaces all existing algorithms and parameters for this provider atomically.
 */
export async function fetchMetadata(provider: ComputationProvider): Promise<FetchMetadataResult> {
    if (!provider.id) {
        return { ok: false, error: "Provider must be saved before fetching metadata." };
    }

    const preview = await fetchMetadataPreview(provider);
    if (!preview.ok) {
        return { ok: false, error: preview.error };
    }

    try {
        await persistFetchedMetadata(provider.id, preview.metadata);
        return { ok: true, algorithmCount: preview.algorithmCount };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: `Metadata save failed: ${message}` };
    }
}
