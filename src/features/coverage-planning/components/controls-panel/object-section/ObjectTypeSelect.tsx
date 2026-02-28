import { useObjectTypeStore } from "@/features/coverage-planning/stores/env-section/objectTypeStore";
import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import type { ObjectType } from "@/config/db-ops/enums";

export default function TypeSelection() {
  const selectedType = useObjectTypeStore((state) => state.selectedObjectType);
  const types = useObjectTypeStore((state) => state.objectTypes);
  const setSelectedType = useObjectTypeStore(
    (state) => state.setSelectedObjectType,
  );

  return (
    <ControlsPanelSectionSelect
      label="Type"
      value={selectedType}
      onChange={(value) => setSelectedType(value as ObjectType)}
      options={types}
    />
  );
}
