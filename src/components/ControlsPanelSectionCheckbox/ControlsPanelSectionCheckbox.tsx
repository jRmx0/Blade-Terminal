import type { ControlsPanelSectionCheckboxProps } from "@/types/controlsPanelTypes";

export default function ControlsPanelSectionCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
}: ControlsPanelSectionCheckboxProps) {
  return (
    <label className="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer select-none transition-colors disabled:cursor-not-allowed disabled:opacity-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
      />
      <span className="flex-1">{label}</span>
    </label>
  );
}
