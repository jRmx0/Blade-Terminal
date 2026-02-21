import { useControlsPanelStore } from "@/stores/controlsPanelStore";
import ControlsPanelSectionTitle from "@/components/ControlsPanelSectionTitle/ControlsPanelSectionTitle";
import ObjectTypeSelect from "@/features/coverage-planning/components/controls-panel/ObjectSection/ObjectTypeSelect/ObjectTypeSelect";

export default function ObjectSection() {
  const isExpanded = useControlsPanelStore(
    (state) => state.expandedSections["object"],
  );

  return (
    <div className="flex flex-col gap-1">
      <ControlsPanelSectionTitle sectionId="object" title="Object" />

      {isExpanded && (
        <div className="flex flex-col pl-1">
          <ObjectTypeSelect />
        </div>
      )}
    </div>
  );
}
