import { useEnvStore } from "@/stores/envStore";
import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import { ENV_FORMAT_OPTIONS, type EnvFormat } from "@/config/db-ops/enums";

export default function FormatSelection() {
  const format = useEnvStore((s) => s.env.format);
  const setFormat = useEnvStore((s) => s.setFormat);

  return (
    <ControlsPanelSectionSelect
      label="Format"
      value={format}
      onChange={(value) => setFormat(value as EnvFormat)}
      options={ENV_FORMAT_OPTIONS}
      placeholder="Select format..."
    />
  );
}
