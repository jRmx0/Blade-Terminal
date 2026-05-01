import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";
import { useMemo } from "react";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { computeNumberOfTurns } from "@/utils/coverageGrid";

export default function TurnSumField() {
  const result = useComputeResultStore((s) => s.result);
  const catalogMetrics = useComputationCatalogStore((s) => s.metrics);

  const value = useMemo(() => {
    if (!result) return "\u2014";

    const algorithmMetrics = catalogMetrics.filter(
      (m) => m.algorithmId === result.algorithmId && m.computationProviderId === result.providerId,
    );

    const turnsMeta =
      algorithmMetrics.find((m) => m.name.trim().toLowerCase() === "number of turns") ??
      algorithmMetrics.find((m) => m.name.toLowerCase().includes("turn"));

    const metricValue = turnsMeta
      ? result.result.performance?.metrics.find((m) => m.id === turnsMeta.id)?.value
      : undefined;

    if (typeof metricValue === "number" && Number.isFinite(metricValue)) {
      return Math.round(metricValue).toString();
    }

    return computeNumberOfTurns(result.result.coveragePathPlan.segments).toString();
  }, [result, catalogMetrics]);

  return <InspectorPanelSectionField label="Number of turns" value={value} />;
}
