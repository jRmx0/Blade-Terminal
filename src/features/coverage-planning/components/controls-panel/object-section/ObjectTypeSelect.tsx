import { useEnvStore } from "@/stores/envStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import {
  OBJECT_TYPE_OPTIONS,
  isGlobalTypeFixed,
  defaultObjectTypeForGlobal,
  type ObjectType,
} from "@/config/db-ops/enums";

export default function ObjectTypeSelect() {
  const globalType = useEnvStore((s) => s.env.type);
  const selectedObject = useCanvasSelectionStore((s) => s.selectedObject);
  const updateObjectType = useCanvasObjectStore((s) => s.updateObjectType);
  const liveObject = useCanvasObjectStore(
    (s) => selectedObject ? s.objects.find((o) => o.id === selectedObject.id) ?? null : null,
  );

  const isFixed = isGlobalTypeFixed(globalType);
  const forcedType = defaultObjectTypeForGlobal(globalType);

  // Displayed value: forced type when global is fixed; selected object's type; empty when nothing selected
  const displayValue: ObjectType | "" = isFixed
    ? forcedType
    : (liveObject?.type ?? (selectedObject === null ? "" : defaultObjectTypeForGlobal(globalType)));

  const isDisabled = isFixed || selectedObject === null;

  function handleChange(value: string) {
    if (isDisabled || selectedObject === null) return;
    updateObjectType(selectedObject, value as ObjectType);
  }

  return (
    <ControlsPanelSectionSelect
      label="Type"
      value={displayValue}
      onChange={handleChange}
      options={OBJECT_TYPE_OPTIONS}
      disabled={isDisabled}
    />
  );
}

