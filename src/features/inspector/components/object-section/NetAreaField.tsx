import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { computeNetArea } from "@/features/canvas-editing/utils/canvasGeometry";

export default function NetAreaField() {
  const selectedObjectId = useCanvasSelectionStore((s) => s.selectedObject?.id ?? null);
  const objects = useCanvasObjectStore((s) => s.objects);

  if (selectedObjectId === null) return null;

  // Look up the object from the object store (always current) rather than the selection store
  // (which holds a snapshot from click time and may have stale vertices/area).
  const selectedObject = objects.find((o) => o.id === selectedObjectId) ?? null;
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

