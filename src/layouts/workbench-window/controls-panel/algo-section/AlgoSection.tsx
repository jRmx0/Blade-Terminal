import ControlsPanelSection from "@/components/ControlsPanelSection/ControlsPanelSection";
import AlgoSelect from "@/features/coverage-planning/components/controls-panel/AlgoSection/AlgoSelect/AlgoSelect";
import PathWidthInput from "@/features/coverage-planning/components/controls-panel/AlgoSection/PathWidthInput/PathWidthInput";
import PathOverlapInput from "@/features/coverage-planning/components/controls-panel/AlgoSection/PathOverlapInput/PathOverlapInput";

export default function AlgoSection() {
  return (
    <ControlsPanelSection sectionId="algo" title="Coverage Path">
      <AlgoSelect />
      <PathWidthInput />
      <PathOverlapInput />
    </ControlsPanelSection>
  );
}
