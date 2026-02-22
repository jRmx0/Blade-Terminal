import ControlsPanelSection from "@/components/controls-panel/ControlsPanelSection";
import AlgoSelect from "@/features/coverage-planning/components/controls-panel/algo-section/AlgoSelect";
import PathWidthInput from "@/features/coverage-planning/components/controls-panel/algo-section/PathWidthInput";
import PathOverlapInput from "@/features/coverage-planning/components/controls-panel/algo-section/PathOverlapInput";

export default function AlgoSection() {
  return (
    <ControlsPanelSection sectionId="algo" title="Coverage Path">
      <AlgoSelect />
      <PathWidthInput />
      <PathOverlapInput />
    </ControlsPanelSection>
  );
}
