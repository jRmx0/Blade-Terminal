import { useFormatStore } from "@/features/coverage-planning/stores/env-section/formatStore";
import ControlsPanelSectionSelect from "@/components/ControlsPanelSectionSelect/ControlsPanelSectionSelect";

export default function FormatSelection() {
  const selectedFormat = useFormatStore((state) => state.selectedFormat);
  const formats = useFormatStore((state) => state.formats);
  const setSelectedFormat = useFormatStore((state) => state.setSelectedFormat);

  return (
    <ControlsPanelSectionSelect
      label="Format"
      value={selectedFormat}
      onChange={setSelectedFormat}
      options={formats}
      placeholder="Select format..."
    />
  );
}
