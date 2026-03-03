import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { computeNetArea } from "@/features/canvas-editing/utils/canvasGeometry";

export default function NetAreaField() {
  const selectedObjectId = useCanvasSelectionStore((s) => s.selectedObjectId);
  const objects = useCanvasObjectStore((s) => s.objects);
  const vertices = useCanvasObjectStore((s) => s.vertices);

  if (selectedObjectId === null) return null;

  const netArea = computeNetArea(selectedObjectId, objects, vertices);

  // For obstacles the field is not applicable
  if (netArea === null) return null;

  return (
    <InspectorPanelSectionField
      label="Net area"
      value={netArea.toFixed(2)}
      unit="m²"
    />
  );
}

