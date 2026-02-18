import { useTypeStore } from "@/features/coverage-planning/stores/env-section/typeStore";
import ControlsPanelSectionSelect from "@/components/ControlsPanelSectionSelect/ControlsPanelSectionSelect";

export default function TypeSelection() {
  const selectedType = useTypeStore((state) => state.selectedType);
  const types = useTypeStore((state) => state.types);
  const setSelectedType = useTypeStore((state) => state.setSelectedType);

  return (
    <ControlsPanelSectionSelect
      label="Type"
      value={selectedType}
      onChange={setSelectedType}
      options={types}
      placeholder="Select type..."
    />
  );
}
