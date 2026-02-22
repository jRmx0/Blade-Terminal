import InspectorPanelSection from "@/components/inspector-panel/InspectorPanelSection";
import CoverageField from "@/features/inspector/components/coverage-section/CoverageField/CoverageField";
import OverlapField from "@/features/inspector/components/coverage-section/OverlapField/OverlapField";
import TurnSumField from "@/features/inspector/components/coverage-section/TurnSumField/TurnSumField";

export default function CoverageSection() {
  return (
    <InspectorPanelSection title="Coverage">
      <CoverageField />
      <OverlapField />
      <TurnSumField />
    </InspectorPanelSection>
  );
}
