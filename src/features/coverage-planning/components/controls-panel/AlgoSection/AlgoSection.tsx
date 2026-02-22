import { useControlsPanelStore } from "@/stores/controlsPanelStore";
import ControlsPanelSectionTitle from "@/components/ControlsPanelSectionTitle/ControlsPanelSectionTitle";
import AlgoSelect from "@/features/coverage-planning/components/controls-panel/AlgoSection/AlgoSelect/AlgoSelect";
import PathWidthInput from "@/features/coverage-planning/components/controls-panel/AlgoSection/PathWidthInput/PathWidthInput";
import PathOverlapInput from "@/features/coverage-planning/components/controls-panel/AlgoSection/PathOverlapInput/PathOverlapInput";

export default function AlgoSection() {
  const isExpanded = useControlsPanelStore(
    (state) => state.expandedSections["algo"],
  );

  return (
    <div className="flex flex-col">
      <ControlsPanelSectionTitle sectionId="algo" title="Coverage Path" />

      {isExpanded && (
        <div className="flex flex-col pl-1">
          <AlgoSelect />
          <PathWidthInput />
          <PathOverlapInput />
        </div>
      )}
    </div>
  );
}
