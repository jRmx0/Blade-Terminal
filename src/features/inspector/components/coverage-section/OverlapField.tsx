import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";
import { useMemo, useRef } from "react";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useParameterValuesStore } from "@/stores/parameterValuesStore";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID, LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
import { buildCoverageVisitMap, computeOverlapRatio, resolvePathWidth } from "@/utils/coverageGrid";

export default function OverlapField() {
  const result = useComputeResultStore((s) => s.result);
  const catalogMetrics = useComputationCatalogStore((s) => s.metrics);
  const catalogParams = useComputationCatalogStore((s) => s.parameters);
  const parameterValues = useParameterValuesStore((s) => s.parameterValues);
  const layers = useLayerSettingsStore((s) => s.layers);

  // Refs: path width reads always fresh but don't independently trigger recalc.
  const catalogParamsRef = useRef(catalogParams);
  catalogParamsRef.current = catalogParams;
  const parameterValuesRef = useRef(parameterValues);
  parameterValuesRef.current = parameterValues;

  const value = useMemo(() => {
    if (!result) return "\u2014";

    const algorithmMetrics = catalogMetrics.filter(
      (m) => m.algorithmId === result.algorithmId && m.computationProviderId === result.providerId,
    );

    // Prefer an exact "overlap ratio" metric; fall back to fuzzy match.
    const overlapMeta =
      algorithmMetrics.find((m) => m.name.trim().toLowerCase() === "overlap ratio") ??
      algorithmMetrics.find((m) => {
        const n = m.name.toLowerCase();
        return n.includes("overlap") && n.includes("ratio");
      });

    const metricValue = overlapMeta
      ? result.result.performance?.metrics.find((m) => m.id === overlapMeta.id)?.value
      : undefined;

    if (typeof metricValue === "number" && Number.isFinite(metricValue)) {
      // Provider may emit ratio (e.g. 1.25) or already as percentage (e.g. 125).
      // Overlap ratio is always >= 1, so values < 10 are treated as raw ratios → *100.
      const pct = metricValue < 10 ? metricValue * 100 : metricValue;
      return pct.toFixed(1);
    }

    // Fallback: derive from visit map — fraction of visited cells visited ≥2 times.
    const cellSizeRaw = parseFloat(
      getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_CELL_SIZE) ?? "1",
    );
    const cellSize = Number.isFinite(cellSizeRaw) && cellSizeRaw > 0 ? cellSizeRaw : 1;
    const pathWidth = resolvePathWidth({ result, catalogParams: catalogParamsRef.current, parameterValues: parameterValuesRef.current, fallback: cellSize });
    const { visitMap } = buildCoverageVisitMap({
      segments: result.result.coveragePathPlan.segments,
      cellSize,
      pathWidth,
    });

    const ratio = computeOverlapRatio(visitMap);
    if (ratio == null || !Number.isFinite(ratio)) return "\u2014";
    return ratio.toFixed(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, catalogMetrics, layers]);

  return <InspectorPanelSectionField label="Overlap ratio" value={value} unit="%" />;
}
