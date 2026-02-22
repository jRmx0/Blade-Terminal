interface InspectorPanelSectionTitleProps {
  title: string;
}

export default function InspectorPanelSectionTitle({
  title,
}: InspectorPanelSectionTitleProps) {
  return (
    <div className="w-full flex items-center px-1 py-2">
      <span className="text-base font-medium text-gray-700">{title}</span>
    </div>
  );
}
