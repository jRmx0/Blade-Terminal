import type { ControlsPanelSectionSelectProps } from "@/types/controlsPanelTypes";

export default function ControlsPanelSectionSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: ControlsPanelSectionSelectProps) {
  return (
    <fieldset className="border bg-white border-gray-300 rounded px-2 pt-0.5 pb-1 mx-3 my-1">
      <legend className="text-xs text-gray-500 px-1">{label}</legend>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full text-sm bg-white focus:outline-none disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
