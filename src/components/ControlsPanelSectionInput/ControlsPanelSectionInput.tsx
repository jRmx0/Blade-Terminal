import type { ControlsPanelSectionInputProps } from "@/types/controlsPanelTypes";

export default function ControlsPanelSectionInput({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
}: ControlsPanelSectionInputProps) {
  return (
    <fieldset className="border bg-white border-gray-300 rounded px-2 pt-0.5 pb-1 mx-3 my-1">
      <legend className="text-xs text-gray-500 px-1">{label}</legend>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-1 w-full text-sm bg-white focus:outline-none disabled:text-gray-400 disabled:cursor-not-allowed"
      />
    </fieldset>
  );
}
