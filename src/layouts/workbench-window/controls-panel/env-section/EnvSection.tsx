import ControlsPanelSection from "@/components/controls-panel/ControlsPanelSection";
import GlobalTypeSelection from "@/features/coverage-planning/components/controls-panel/env-section/GlobalTypeSelect";
import FormatSelection from "@/features/coverage-planning/components/controls-panel/env-section/FormatSelect";

export default function EnvSection() {
  return (
    <ControlsPanelSection sectionId="env" title="Environment">
      <GlobalTypeSelection />
      <FormatSelection />
    </ControlsPanelSection>
  );
}
