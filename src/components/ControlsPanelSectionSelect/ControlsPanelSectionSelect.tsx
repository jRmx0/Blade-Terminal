import type { ControlsPanelSectionSelectProps } from "@/types/controlsPanelTypes";

export default function ControlsPanelSectionSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder,
}: ControlsPanelSectionSelectProps) {
  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-2 py-1 rounded border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
