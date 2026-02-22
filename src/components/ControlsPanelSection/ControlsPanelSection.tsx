import { useControlsPanelStore } from "@/stores/controlsPanelStore";
import ControlsPanelSectionTitle from "@/components/ControlsPanelSectionTitle/ControlsPanelSectionTitle";
import type { ControlsPanelSectionId } from "@/types/controlsPanelTypes";

interface ControlsPanelSectionProps {
  sectionId: ControlsPanelSectionId;
  title: string;
  children: React.ReactNode;
}

export default function ControlsPanelSection({
  sectionId,
  title,
  children,
}: ControlsPanelSectionProps) {
  const isExpanded = useControlsPanelStore(
    (state) => state.expandedSections[sectionId],
  );

  return (
    <div className="flex flex-col">
      <ControlsPanelSectionTitle sectionId={sectionId} title={title} />

      {isExpanded && (
        <div className="flex flex-col pl-1">{children}</div>
      )}
    </div>
  );
}
