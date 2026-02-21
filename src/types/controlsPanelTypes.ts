export type ControlsPanelSectionId = "general" | "algo" | "env" | "object" | "debug";

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

export interface ControlsPanelSectionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

export interface ControlsPanelSectionCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export interface ControlsPanelSectionInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
}

export interface ControlsPanelSectionSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  placeholder?: string;
}
