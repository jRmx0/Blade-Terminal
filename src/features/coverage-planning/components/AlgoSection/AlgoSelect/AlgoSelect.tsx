import { useAlgoSelectionStore } from "@/features/coverage-planning/stores/algo-section/algoSelectionStore";
import ControlsPanelSectionSelect from "@/components/ControlsPanelSectionSelect/ControlsPanelSectionSelect";

export default function AlgoSelect() {
  const selectedAlgo = useAlgoSelectionStore((state) => state.selectedAlgo);
  const algorithms = useAlgoSelectionStore((state) => state.algorithms);
  const setSelectedAlgo = useAlgoSelectionStore(
    (state) => state.setSelectedAlgo,
  );

  return (
    <ControlsPanelSectionSelect
      label="Algorithm"
      value={selectedAlgo}
      onChange={setSelectedAlgo}
      options={algorithms}
      placeholder="Select algorithm..."
    />
  );
}
