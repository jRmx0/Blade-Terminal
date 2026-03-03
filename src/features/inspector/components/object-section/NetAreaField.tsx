import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";

export default function NetAreaField() {
  // Net area (gross minus contained obstacles) is computed during coverage planning.
  return <InspectorPanelSectionField label="Net area" value="—" />;
}

