import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";

export default function VertexSumField() {
  const selectedObjectId = useCanvasSelectionStore((s) => s.selectedObjectId);
  const count = useCanvasObjectStore(
    (s) => s.vertices.filter((v) => v.objectId === selectedObjectId).length,
  );

  return (
    <InspectorPanelSectionField label="Number of vertices" value={count} />
  );
}

