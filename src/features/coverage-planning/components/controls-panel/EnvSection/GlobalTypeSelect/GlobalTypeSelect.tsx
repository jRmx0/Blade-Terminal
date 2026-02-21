import { useGlobalTypeStore } from "@/features/coverage-planning/stores/env-section/globalTypeStore";
import ControlsPanelSectionSelect from "@/components/ControlsPanelSectionSelect/ControlsPanelSectionSelect";

export default function GlobalTypeSelection() {
  const selectedGlobalType = useGlobalTypeStore(
    (state) => state.selectedGlobalType,
  );
  const globalTypes = useGlobalTypeStore((state) => state.globalTypes);
  const setSelectedGlobalType = useGlobalTypeStore(
    (state) => state.setSelectedGlobalType,
  );

  return (
    <ControlsPanelSectionSelect
      label="Global Type"
      value={selectedGlobalType}
      onChange={setSelectedGlobalType}
      options={globalTypes}
    />
  );
}
