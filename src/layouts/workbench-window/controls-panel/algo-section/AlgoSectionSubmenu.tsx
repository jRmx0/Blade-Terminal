import { useControlsPanelStore } from "@/stores/controlsPanelStore";
import AlgoSelect from "@/features/coverage-planning/components/algo-section/AlgoSelect/AlgoSelect";
import PathWidthInput from "@/features/coverage-planning/components/algo-section/PathWidthInput/PathWidthInput";
import PathOverlapInput from "@/features/coverage-planning/components/algo-section/PathOverlapInput/PathOverlapInput";

export default function AlgoSectionSubmenu() {
  const isExpanded = useControlsPanelStore(
    (state) => state.expandedSections["algo"],
  );

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <AlgoSelect />
      <PathWidthInput />
      <PathOverlapInput />
    </div>
  );
}
