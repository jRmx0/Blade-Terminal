import { buildComputationProviderEndpointUrl } from "@/features/computation-provider/utils/computationProviderUrl";
import { buildComputeRequestBody, buildHeaders } from "./computeService";
import { useCppDebugStore } from "@/features/coverage-planning/stores/cppDebugStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DebugSegment = {
    id: number;
    type: string;
    path: unknown[];
};

export type StartDebugResult =
    | { ok: true; sessionId: string; totalSteps: number }
    | { ok: false; error: string };

export type StepDebugResult =
    | { ok: true; stepIndex: number; totalSteps: number; done: boolean; segment: DebugSegment }
    | { ok: false; error: string };

export type RestartDebugResult =
    | { ok: true; sessionId: string; totalSteps: number; stepIndex: number }
    | { ok: false; error: string };

// ─── Service ─────────────────────────────────────────────────────────────────

export async function startDebugSession(): Promise<StartDebugResult> {
    const bodyResult = buildComputeRequestBody();
    if (!bodyResult.ok) return bodyResult;

    const builtUrl = buildComputationProviderEndpointUrl(bodyResult.provider.url, "/compute/debug");
    if (!builtUrl.ok) {
        return { ok: false, error: `Provider URL is invalid: ${builtUrl.error}` };
    }

    try {
        const response = await fetch(builtUrl.url, {
            method: "POST",
            headers: buildHeaders(bodyResult.provider.apiKey),
            body: JSON.stringify(bodyResult.body),
        });

        const data = await response.json() as Record<string, unknown>;

        if (!response.ok) {
            const message = (data["error"] as Record<string, unknown> | undefined)?.["message"];
            return { ok: false, error: typeof message === "string" ? message : `Server error ${response.status}` };
        }

        const sessionId = data["sessionId"] as string;
        const totalSteps = data["totalSteps"] as number;

        const store = useCppDebugStore.getState();
        store.setSessionId(sessionId);
        store.setTotalSteps(totalSteps);
        store.setCurrentStep(0);
        store.startDebug();

        return { ok: true, sessionId, totalSteps };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    }
}

export async function stepDebugSession(): Promise<StepDebugResult> {
    const { sessionId, currentStep } = useCppDebugStore.getState();
    if (!sessionId) {
        return { ok: false, error: "No active debug session." };
    }

    const bodyResult = buildComputeRequestBody();
    if (!bodyResult.ok) return bodyResult;

    const builtUrl = buildComputationProviderEndpointUrl(bodyResult.provider.url, `/compute/debug/${encodeURIComponent(sessionId)}/step`);
    if (!builtUrl.ok) {
        return { ok: false, error: `Provider URL is invalid: ${builtUrl.error}` };
    }

    try {
        const response = await fetch(builtUrl.url, {
            method: "POST",
            headers: buildHeaders(bodyResult.provider.apiKey),
        });

        const data = await response.json() as Record<string, unknown>;

        if (!response.ok) {
            const message = (data["error"] as Record<string, unknown> | undefined)?.["message"];
            return { ok: false, error: typeof message === "string" ? message : `Server error ${response.status}` };
        }

        const stepIndex = data["stepIndex"] as number;
        const done = data["done"] as boolean;
        const segment = data["segment"] as DebugSegment;

        useCppDebugStore.getState().setCurrentStep(currentStep + 1);

        return { ok: true, stepIndex, totalSteps: data["totalSteps"] as number, done, segment };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    }
}

export async function restartDebugSession(): Promise<RestartDebugResult> {
    const { sessionId } = useCppDebugStore.getState();
    if (!sessionId) {
        return { ok: false, error: "No active debug session." };
    }

    const bodyResult = buildComputeRequestBody();
    if (!bodyResult.ok) return bodyResult;

    const builtUrl = buildComputationProviderEndpointUrl(bodyResult.provider.url, `/compute/debug/${encodeURIComponent(sessionId)}/restart`);
    if (!builtUrl.ok) {
        return { ok: false, error: `Provider URL is invalid: ${builtUrl.error}` };
    }

    try {
        const response = await fetch(builtUrl.url, {
            method: "POST",
            headers: buildHeaders(bodyResult.provider.apiKey),
        });

        const data = await response.json() as Record<string, unknown>;

        if (!response.ok) {
            const message = (data["error"] as Record<string, unknown> | undefined)?.["message"];
            return { ok: false, error: typeof message === "string" ? message : `Server error ${response.status}` };
        }

        useCppDebugStore.getState().setCurrentStep(0);

        return {
            ok: true,
            sessionId: data["sessionId"] as string,
            totalSteps: data["totalSteps"] as number,
            stepIndex: data["stepIndex"] as number,
        };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    }
}

export async function stopDebugSession(): Promise<void> {
    const { sessionId } = useCppDebugStore.getState();
    // Always reset store state, even if the server call fails
    useCppDebugStore.getState().stopDebug();

    if (!sessionId) return;

    // We don't have a provider URL here without calling buildComputeRequestBody.
    // Use it for the URL only; failures are silent since session is ephemeral.
    const bodyResult = buildComputeRequestBody();
    if (!bodyResult.ok) return;

    const builtUrl = buildComputationProviderEndpointUrl(bodyResult.provider.url, `/compute/debug/${encodeURIComponent(sessionId)}`);
    if (!builtUrl.ok) return;

    try {
        await fetch(builtUrl.url, {
            method: "DELETE",
            headers: buildHeaders(bodyResult.provider.apiKey),
        });
    } catch {
        // Silent — session is transient, no need to surface this error
    }
}
