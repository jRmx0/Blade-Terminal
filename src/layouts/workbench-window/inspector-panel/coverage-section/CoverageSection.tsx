import InspectorPanelSection from "@/components/inspector-panel/InspectorPanelSection";
import CoverageField from "@/features/inspector/components/coverage-section/CoverageField";
import OverlapField from "@/features/inspector/components/coverage-section/OverlapField";
import TurnSumField from "@/features/inspector/components/coverage-section/TurnSumField";

export default function CoverageSection() {
  return (
    <InspectorPanelSection title="Coverage">
      <CoverageField />
      <OverlapField />
      <TurnSumField />
    </InspectorPanelSection>
  );
}
