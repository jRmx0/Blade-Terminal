import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";
import { useComputeResultStore } from "@/stores/useComputeResultStore";

export default function PathLengthField() {
    const value = useComputeResultStore((s) => s.coverageMetrics.pathLength);
    const display = value == null || !Number.isFinite(value) ? "—" : value.toFixed(2);

    return <InspectorPanelSectionField label="Path length" value={display} />;
}
