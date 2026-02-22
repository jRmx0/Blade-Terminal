import ControlsPanelSection from "@/components/controls-panel/ControlsPanelSection";
import ObjectTypeSelect from "@/features/coverage-planning/components/controls-panel/ObjectSection/ObjectTypeSelect/ObjectTypeSelect";

export default function ObjectSection() {
  return (
    <ControlsPanelSection sectionId="object" title="Object">
      <ObjectTypeSelect />
    </ControlsPanelSection>
  );
}
