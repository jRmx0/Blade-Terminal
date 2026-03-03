import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";

export default function GrossAreaField() {
  const selectedObjectId = useCanvasSelectionStore((s) => s.selectedObjectId);
  const area = useCanvasObjectStore(
    (s) => s.objects.find((o) => o.id === selectedObjectId)?.area ?? 0,
  );

  return (
    <InspectorPanelSectionField
      label="Gross area"
      value={area.toFixed(2)}
      unit="m²"
    />
  );
}

