import { useGlobalTypeStore } from "@/features/coverage-planning/stores/env-section/globalTypeStore";
import ControlsPanelSectionCheckbox from "@/components/ControlsPanelSectionCheckbox/ControlsPanelSectionCheckbox";

export default function GlobalTypeCheckbox() {
  const isGlobalType = useGlobalTypeStore((state) => state.isGlobalType);
  const setGlobalType = useGlobalTypeStore((state) => state.setGlobalType);

  return (
    <ControlsPanelSectionCheckbox
      label="Global Type"
      checked={isGlobalType}
      onChange={setGlobalType}
    />
  );
}
