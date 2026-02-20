import { useControlsPanelStore } from "@/stores/controlsPanelStore";
import ControlsPanelSectionTitle from "@/components/ControlsPanelSectionTitle/ControlsPanelSectionTitle";
import TypeSelection from "@/features/coverage-planning/components/controls-panel/EnvSection/TypeSelect/TypeSelect";
import GlobalTypeCheckbox from "@/features/coverage-planning/components/controls-panel/EnvSection/GlobalTypeCheckbox/GlobalTypeCheckbox";
import FormatSelection from "@/features/coverage-planning/components/controls-panel/EnvSection/FormatSelect/FormatSelect";

export default function EnvSection() {
  const isExpanded = useControlsPanelStore(
    (state) => state.expandedSections["env"],
  );

  return (
    <div className="flex flex-col gap-1">
      <ControlsPanelSectionTitle sectionId="env" title="Environment" />

      {isExpanded && (
        <div className="flex flex-col pl-1">
          <TypeSelection />
          <GlobalTypeCheckbox />
          <FormatSelection />
        </div>
      )}
    </div>
  );
}
