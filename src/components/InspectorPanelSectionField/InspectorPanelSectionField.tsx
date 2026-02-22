interface InspectorPanelSectionFieldProps {
  label: string;
  value: string | number;
  unit?: string;
}

export default function InspectorPanelSectionField({
  label,
  value,
  unit,
}: InspectorPanelSectionFieldProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <span
        className="min-w-0 flex-1 truncate text-base text-gray-800"
        title={label}
      >
        {label}
      </span>
      <span className="shrink-0 text-base text-gray-800">
        {value}
        {unit && <span className="text-gray-800 ml-1">{unit}</span>}
      </span>
    </div>
  );
}
