import ControlsPanelSection from "@/components/controls-panel/ControlsPanelSection";
import GlobalTypeSelection from "@/features/coverage-planning/components/controls-panel/EnvSection/GlobalTypeSelect/GlobalTypeSelect";
import FormatSelection from "@/features/coverage-planning/components/controls-panel/EnvSection/FormatSelect/FormatSelect";

export default function EnvSection() {
  return (
    <ControlsPanelSection sectionId="env" title="Environment">
      <GlobalTypeSelection />
      <FormatSelection />
    </ControlsPanelSection>
  );
}
