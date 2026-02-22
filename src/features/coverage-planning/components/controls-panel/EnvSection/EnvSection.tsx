import { useControlsPanelStore } from "@/stores/controlsPanelStore";
import ControlsPanelSectionTitle from "@/components/ControlsPanelSectionTitle/ControlsPanelSectionTitle";
import GlobalTypeSelection from "@/features/coverage-planning/components/controls-panel/EnvSection/GlobalTypeSelect/GlobalTypeSelect";
import FormatSelection from "@/features/coverage-planning/components/controls-panel/EnvSection/FormatSelect/FormatSelect";

export default function EnvSection() {
  const isExpanded = useControlsPanelStore(
    (state) => state.expandedSections["env"],
  );

  return (
    <div className="flex flex-col">
      <ControlsPanelSectionTitle sectionId="env" title="Environment" />

      {isExpanded && (
        <div className="flex flex-col pl-1">
          <GlobalTypeSelection />
          <FormatSelection />
        </div>
      )}
    </div>
  );
}
