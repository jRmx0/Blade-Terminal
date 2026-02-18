import type { ControlsPanelSectionInputProps } from "@/types/controlsPanel";

export default function ControlsPanelSectionInput({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  type = "text",
}: ControlsPanelSectionInputProps) {
  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
      />
    </div>
  );
}
