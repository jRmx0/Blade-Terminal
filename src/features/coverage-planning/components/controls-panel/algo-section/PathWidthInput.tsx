import { usePathWidthStore } from "@/features/coverage-planning/stores/algo-section/pathWidthStore";
import ControlsPanelSectionInput from "@/components/controls-panel/ControlsPanelSectionInput";

export default function PathWidthInput() {
  const pathWidth = usePathWidthStore((state) => state.pathWidth);
  const setPathWidth = usePathWidthStore((state) => state.setPathWidth);

  return (
    <ControlsPanelSectionInput
      label="Path Width"
      value={pathWidth.toString()}
      onChange={(value) => setPathWidth(Math.max(0, parseFloat(value) || 0))}
      type="number"
    />
  );
}
