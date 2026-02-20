import { useControlsPanelStore } from "@/stores/controlsPanelStore";
import type { ControlsPanelSectionTitleProps } from "@/types/controlsPanelTypes";

export default function ControlsPanelSectionTitle({
  sectionId,
  title,
}: ControlsPanelSectionTitleProps) {
  const isExpanded = useControlsPanelStore(
    (state) => state.expandedSections[sectionId],
  );
  const toggleSection = useControlsPanelStore((state) => state.toggleSection);

  return (
    <button
      type="button"
      title={title}
      onClick={() => toggleSection(sectionId)}
      className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 cursor-pointer select-none"
    >
      <span className="material-symbols-outlined w-5 h-5 flex items-center justify-center">
        {isExpanded ? "expand_less" : "expand_more"}
      </span>
      <span>{title}</span>
    </button>
  );
}
