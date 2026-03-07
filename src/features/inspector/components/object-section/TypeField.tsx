import InspectorPanelSectionField from "@/components/inspector-panel/InspectorPanelSectionField";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { OBJECT_TYPE_OPTIONS } from "@/config/db-ops/enums";

export default function TypeField() {
  const selectedObjectId = useCanvasSelectionStore((s) => s.selectedObject?.id);
  const type = useCanvasObjectStore(
    (s) => s.objects.find((o) => o.id === selectedObjectId)?.type,
  );

  const label =
    OBJECT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "—";

  return <InspectorPanelSectionField label="Type" value={label} />;
}

