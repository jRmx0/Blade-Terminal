import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";
import { useMemo, useRef } from "react";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useParameterValuesStore } from "@/stores/parameterValuesStore";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID, LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
import { useEnvStore } from "@/stores/envStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { buildCoverageVisitMap, computeCoverageRatio, resolvePathWidth } from "@/utils/coverageGrid";

export default function CoverageField() {
  const result = useComputeResultStore((s) => s.result);
  const catalogMetrics = useComputationCatalogStore((s) => s.metrics);
  const catalogParams = useComputationCatalogStore((s) => s.parameters);
  const parameterValues = useParameterValuesStore((s) => s.parameterValues);
  const layers = useLayerSettingsStore((s) => s.layers);
  const env = useEnvStore((s) => s.env);
  // In-memory objects from the canvas store — always reflect the current session
  // state (including unsaved edits), so obstacles are visible immediately.
  const allObjects = useCanvasObjectStore((s) => s.objects);
  const objects = useMemo(
    () => allObjects.filter((o) => o.environmentId === env.id),
    [allObjects, env.id],
  );

  // Refs keep latest catalog/param values available without triggering recalc.
  // Coverage ratio must reflect the last completed run, not the current slider.
  const catalogParamsRef = useRef(catalogParams);
  catalogParamsRef.current = catalogParams;
  const parameterValuesRef = useRef(parameterValues);
  parameterValuesRef.current = parameterValues;

  const value = useMemo(() => {
    if (!result) return "—";

    const algorithmMetrics = catalogMetrics.filter(
      (m) => m.algorithmId === result.algorithmId && m.computationProviderId === result.providerId,
    );

    // Prefer a direct "coverage ratio" metric; fall back to any metric containing both words.
    const coverageMeta =
      algorithmMetrics.find((m) => m.name.trim().toLowerCase() === "coverage ratio") ??
      algorithmMetrics.find((m) => {
        const n = m.name.toLowerCase();
        return n.includes("coverage") && n.includes("ratio");
      });

    const metricValue = coverageMeta
      ? result.result.performance?.metrics.find((m) => m.id === coverageMeta.id)?.value
      : undefined;

    if (typeof metricValue === "number" && Number.isFinite(metricValue)) {
      // Provider may emit ratio [0..1] or percentage [0..100]. Normalize to percentage for display.
      const pct = metricValue <= 1 ? metricValue * 100 : metricValue;
      return pct.toFixed(1);
    }

    // Fallback: compute from local map + workspace polygons.
    const cellSizeRaw = parseFloat(
      getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_CELL_SIZE) ?? "1",
    );
    const cellSize = Number.isFinite(cellSizeRaw) && cellSizeRaw > 0 ? cellSizeRaw : 1;
    const pathWidth = resolvePathWidth({ result, catalogParams: catalogParamsRef.current, parameterValues: parameterValuesRef.current, fallback: cellSize });
    const visitMap = buildCoverageVisitMap({
      segments: result.result.coveragePathPlan.segments,
      cellSize,
      pathWidth,
    }).visitMap;

    const ratio = computeCoverageRatio({ visitMap, cellSize, objects });
    if (ratio == null || !Number.isFinite(ratio)) return "—";
    return (ratio * 100).toFixed(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, catalogMetrics, layers, objects]);


  return <InspectorPanelSectionField label="Coverage ratio" value={value} unit="%" />;
}
