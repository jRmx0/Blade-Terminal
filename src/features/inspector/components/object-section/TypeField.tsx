import InspectorPanelSectionSelectField from "@/components/inspector-panel/InspectorPanelSectionSelectField";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { OBJECT_TYPE, OBJECT_TYPE_OPTIONS, isGlobalTypeFixed, type ObjectType } from "@/config/db-ops/enums";
import { useEnvStore } from "@/stores/envStore";

const TYPE_OPTIONS = OBJECT_TYPE_OPTIONS.filter((o) => o.value !== OBJECT_TYPE.EMPTY);

export default function TypeField() {
  const selectedObject = useCanvasSelectionStore((s) => s.selectedObject);
  const type = useCanvasObjectStore(
    (s) => s.objects.find((o) => o.id === selectedObject?.id)?.type,
  );
  const updateObjectType = useCanvasObjectStore((s) => s.updateObjectType);
  const globalType = useEnvStore((s) => s.env.type);

  if (!selectedObject || type === undefined) return null;

  return (
    <InspectorPanelSectionSelectField
      label="Type"
      value={type}
      options={TYPE_OPTIONS}
      disabled={isGlobalTypeFixed(globalType)}
      onChange={(v) => updateObjectType(selectedObject, v as ObjectType)}
    />
  );
}

