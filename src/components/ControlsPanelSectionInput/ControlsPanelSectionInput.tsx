import type { ControlsPanelSectionInputProps } from "@/types/controlsPanelTypes";

export default function ControlsPanelSectionInput({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
}: ControlsPanelSectionInputProps) {
  return (
    <fieldset className="group border bg-white border-gray-300 rounded px-2 pt-0.5 pb-1 mx-3 my-1 focus-within:border-blue-500 select-none">
      <legend className="text-xs text-gray-500 px-1 group-focus-within:text-blue-500">
        {label}
      </legend>
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
