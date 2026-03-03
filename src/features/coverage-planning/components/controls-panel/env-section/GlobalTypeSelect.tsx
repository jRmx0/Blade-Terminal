import { useEnvStore } from "@/stores/envStore";
import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import { GLOBAL_TYPE_OPTIONS, type GlobalType } from "@/config/db-ops/enums";

export default function GlobalTypeSelection() {
  const type = useEnvStore((s) => s.env.type);
  const setType = useEnvStore((s) => s.setType);

  return (
    <ControlsPanelSectionSelect
      label="Global Type"
      value={type}
      onChange={(v) => setType(v as GlobalType)}
      options={GLOBAL_TYPE_OPTIONS}
    />
  );
}
