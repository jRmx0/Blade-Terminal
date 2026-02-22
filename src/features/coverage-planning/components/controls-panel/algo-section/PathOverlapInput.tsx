import { usePathOverlapStore } from "@/features/coverage-planning/stores/algo-section/pathOverlapStore";
import ControlsPanelSectionInput from "@/components/controls-panel/ControlsPanelSectionInput";

export default function PathOverlapInput() {
  const pathOverlap = usePathOverlapStore((state) => state.pathOverlap);
  const setPathOverlap = usePathOverlapStore((state) => state.setPathOverlap);

  return (
    <ControlsPanelSectionInput
      label="Path Overlap"
      value={pathOverlap.toString()}
      onChange={(value) => setPathOverlap(Math.max(0, parseFloat(value) || 0))}
      type="number"
    />
  );
}
