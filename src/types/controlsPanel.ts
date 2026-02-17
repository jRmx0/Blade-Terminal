export type ControlsPanelSectionId = "general" | "env" | "algo" | "debug";

export interface ControlsPanelState {
  expandedSections: Record<ControlsPanelSectionId, boolean>;
  toggleSection: (sectionId: ControlsPanelSectionId) => void;
  expandSection: (sectionId: ControlsPanelSectionId) => void;
  collapseSection: (sectionId: ControlsPanelSectionId) => void;
}

export interface ControlsPanelSectionTitleProps {
  sectionId: ControlsPanelSectionId;
  title: string;
}
