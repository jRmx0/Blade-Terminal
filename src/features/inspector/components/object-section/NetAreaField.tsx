import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { computeNetArea } from "@/features/canvas-editing/utils/canvasGeometry";

export default function NetAreaField() {
  const selectedObject = useCanvasSelectionStore((s) => s.selectedObject);
  const objects = useCanvasObjectStore((s) => s.objects);

  if (selectedObject === null) return null;

  const netArea = computeNetArea(selectedObject, objects);

  // For obstacles the field is not applicable
  if (netArea === null) return null;

  return (
    <InspectorPanelSectionField
      label="Net area"
      value={netArea.toFixed(2)}
    />
  );
}

