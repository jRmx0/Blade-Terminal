import {
    getCoverageGridVisitCache,
    saveCoverageGridVisitCache,
} from "@server/db/coverageGridVisitCache";
import { LAYER_ID, LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useComputeResultStore, type CoverageMetricsState } from "@/stores/useComputeResultStore";
import { useEnvStore } from "@/stores/envStore";
import { getLayerParam, useLayerSettingsStore } from "@/stores/layerSettingsStore";
import { useParameterValuesStore } from "@/stores/parameterValuesStore";
import type { CoverageGridVisitCacheRecord } from "@/types/schemaTypes";
import {
    buildCoverageVisitMap,
    computeCoverageRatio,
    computeNumberOfTurns,
    computeOverlapRatio,
    computeResultSignature,
    resolvePathWidth,
    serializeVisitMap,
} from "@/utils/coverageGrid";

function resolveCellSizeFromLayers(): number {
    const layers = useLayerSettingsStore.getState().layers;
    const raw = parseFloat(
        getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_CELL_SIZE) ?? "1",
    );
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

function resolveNumericMetricValueByName(
    metricName: "coverage ratio" | "overlap ratio" | "number of turns",
): number | null {
    const result = useComputeResultStore.getState().result;
    if (!result) return null;

    const catalogMetrics = useComputationCatalogStore.getState().metrics;
    const algorithmMetrics = catalogMetrics.filter(
        (m) => m.algorithmId === result.algorithmId && m.computationProviderId === result.providerId,
    );

    const meta =
        algorithmMetrics.find((m) => m.name.trim().toLowerCase() === metricName) ??
        algorithmMetrics.find((m) => {
            const n = m.name.toLowerCase();
            if (metricName === "coverage ratio") return n.includes("coverage") && n.includes("ratio");
            if (metricName === "overlap ratio") return n.includes("overlap") && n.includes("ratio");
            return n.includes("turn");
        });

    const value = meta
        ? result.result.performance?.metrics.find((m) => m.id === meta.id)?.value
        : undefined;

    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toCoveragePct(metricValue: number | null, fallbackRatio: number | null): number | null {
    if (metricValue !== null) {
        return metricValue <= 1 ? metricValue * 100 : metricValue;
    }
    if (fallbackRatio === null || !Number.isFinite(fallbackRatio)) return null;
    return fallbackRatio * 100;
}

function toOverlapPct(metricValue: number | null, fallbackPct: number | null): number | null {
    if (metricValue !== null) {
        return metricValue < 10 ? metricValue * 100 : metricValue;
    }
    if (fallbackPct === null || !Number.isFinite(fallbackPct)) return null;
    return fallbackPct;
}

function toTurnCount(metricValue: number | null, fallbackTurns: number): number {
    if (metricValue !== null) return Math.round(metricValue);
    return fallbackTurns;
}

function toCoverageMetricsState(record: CoverageGridVisitCacheRecord, source: CoverageMetricsState["source"]): CoverageMetricsState {
    return {
        resultSignature: record.resultSignature,
        cellSize: record.cellSize,
        pathWidth: record.pathWidth,
        coverageRatioPct: record.coverageRatioPct,
        overlapRatioPct: record.overlapRatioPct,
        turnCount: record.turnCount,
        visitEntries: record.visitEntries,
        maxCount: record.maxCount,
        source,
        computedAt: record.createdAt,
    };
}

let inFlightRunId = 0;

export async function hydrateCoverageCacheForCurrentResult(): Promise<void> {
    const result = useComputeResultStore.getState().result;
    if (!result) {
        useComputeResultStore.getState().clearCoverageMetrics();
        return;
    }

    const runId = ++inFlightRunId;
    const cellSize = resolveCellSizeFromLayers();
    const resultSignature = computeResultSignature(result);
    const environmentId = result.environmentId;

    const cached = await getCoverageGridVisitCache(environmentId, resultSignature, cellSize);
    if (runId !== inFlightRunId) return;

    const currentResult = useComputeResultStore.getState().result;
    if (!currentResult || computeResultSignature(currentResult) !== resultSignature) return;

    if (cached) {
        useComputeResultStore.getState().setCoverageMetrics(toCoverageMetricsState(cached, "cache"));
        return;
    }

    const layers = useLayerSettingsStore.getState().layers;
    const catalogParams = useComputationCatalogStore.getState().parameters;
    const parameterValues = useParameterValuesStore.getState().parameterValues;
    const envId = useEnvStore.getState().env.id;
    const allObjects = useCanvasObjectStore.getState().objects;
    const objects = allObjects.filter((o) => o.environmentId === envId);

    const pathWidth = resolvePathWidth({
        result,
        catalogParams,
        parameterValues,
        fallback: cellSize,
    });

    const { visitMap, maxCount } = buildCoverageVisitMap({
        segments: result.result.coveragePathPlan.segments,
        cellSize,
        pathWidth,
    });

    const fallbackCoverageRatio = computeCoverageRatio({ visitMap, cellSize, objects });
    const fallbackOverlapPct = computeOverlapRatio(visitMap);
    const fallbackTurns = computeNumberOfTurns(result.result.coveragePathPlan.segments);

    const coverageMetricValue = resolveNumericMetricValueByName("coverage ratio");
    const overlapMetricValue = resolveNumericMetricValueByName("overlap ratio");
    const turnsMetricValue = resolveNumericMetricValueByName("number of turns");

    const record: CoverageGridVisitCacheRecord = {
        environmentId,
        resultSignature,
        cellSize,
        pathWidth,
        visitEntries: serializeVisitMap(visitMap),
        maxCount,
        coverageRatioPct: toCoveragePct(coverageMetricValue, fallbackCoverageRatio),
        overlapRatioPct: toOverlapPct(overlapMetricValue, fallbackOverlapPct),
        turnCount: toTurnCount(turnsMetricValue, fallbackTurns),
        createdAt: new Date().toISOString(),
    };

    await saveCoverageGridVisitCache(record);
    if (runId !== inFlightRunId) return;

    const latestResult = useComputeResultStore.getState().result;
    if (!latestResult || computeResultSignature(latestResult) !== resultSignature) return;

    useComputeResultStore.getState().setCoverageMetrics(toCoverageMetricsState(record, "computed"));
}

let stopSync: (() => void) | null = null;

export function startCoverageCacheSync(): () => void {
    if (stopSync) return stopSync;

    const unsubResult = useComputeResultStore.subscribe((next, prev) => {
        if (next.result !== prev.result) {
            void hydrateCoverageCacheForCurrentResult();
        }
    });

    const unsubLayers = useLayerSettingsStore.subscribe((next, prev) => {
        const nextCellSize = parseFloat(
            getLayerParam(next.layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_CELL_SIZE) ?? "1",
        );
        const prevCellSize = parseFloat(
            getLayerParam(prev.layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_CELL_SIZE) ?? "1",
        );
        if (nextCellSize !== prevCellSize) {
            void hydrateCoverageCacheForCurrentResult();
        }
    });

    const unsubEnv = useEnvStore.subscribe((next, prev) => {
        if (next.env.id !== prev.env.id) {
            void hydrateCoverageCacheForCurrentResult();
        }
    });

    stopSync = () => {
        unsubResult();
        unsubLayers();
        unsubEnv();
        stopSync = null;
    };

    void hydrateCoverageCacheForCurrentResult();

    return stopSync;
}
