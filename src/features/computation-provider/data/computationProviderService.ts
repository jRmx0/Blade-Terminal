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
import { buildComputationProviderEndpointUrl } from "@/features/computation-provider/utils/computationProviderUrl";

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

function getRequestErrorMessage(err: unknown, fallbackMessage: string): string {
    if (err instanceof DOMException && err.name === "TimeoutError") {
        return fallbackMessage;
    }

    if (err instanceof TypeError) {
        return "Request failed. Ensure the service URL is reachable from the browser, the container port is published, and CORS allows this app origin.";
    }

    if (err instanceof Error) {
        return err.message;
    }

    return String(err);
}

function isHtmlResponse(response: Response): boolean {
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

    return contentType.includes("text/html");
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
    const endpoint = buildComputationProviderEndpointUrl(provider.url, "metadata");
    if (!endpoint.ok) {
        return endpoint;
    }

    try {
        const response = await fetch(endpoint.url, {
            method: "GET",
            headers: buildHeaders(provider.apiKey),
            signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) {
            return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }

        if (isHtmlResponse(response)) {
            return { ok: false, error: "Service URL returned HTML instead of provider metadata. Check that it points to the provider container, not this app." };
        }

        return { ok: true, data: (await response.json()) as MetadataResponse };
    } catch (err) {
        return { ok: false, error: getRequestErrorMessage(err, "Metadata request timed out after 30 seconds.") };
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
    const endpoint = buildComputationProviderEndpointUrl(provider.url, "health");
    if (!endpoint.ok) {
        return endpoint;
    }

    try {
        const response = await fetch(endpoint.url, {
            method: "GET",
            headers: buildHeaders(provider.apiKey),
            signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) {
            return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }

        if (isHtmlResponse(response)) {
            return { ok: false, error: "Service URL returned HTML instead of a provider health endpoint. Check that it points to the provider container, not this app." };
        }

        return { ok: true };
    } catch (err) {
        return { ok: false, error: getRequestErrorMessage(err, "Health check timed out after 10 seconds.") };
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
