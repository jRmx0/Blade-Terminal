import ControlsPanelSection from "@/components/controls-panel/ControlsPanelSection";
import ObjectTypeSelect from "@/features/coverage-planning/components/controls-panel/object-section/ObjectTypeSelect";

export default function ObjectSection() {
  return (
    <ControlsPanelSection sectionId="object" title="Object">
      <ObjectTypeSelect />
    </ControlsPanelSection>
  );
}
