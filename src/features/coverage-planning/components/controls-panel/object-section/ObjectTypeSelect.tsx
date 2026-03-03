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
  const selectedObjectId = useCanvasSelectionStore((s) => s.selectedObjectId);
  const updateObjectType = useCanvasObjectStore((s) => s.updateObjectType);
  const selectedObject = useCanvasObjectStore(
    (s) => s.objects.find((o) => o.id === selectedObjectId) ?? null,
  );

  const isFixed = isGlobalTypeFixed(globalType);
  const forcedType = defaultObjectTypeForGlobal(globalType);

  // Displayed value: forced type when global is fixed; selected object's type when any
  const displayValue: ObjectType = isFixed
    ? forcedType
    : (selectedObject?.type ?? defaultObjectTypeForGlobal(globalType));

  const isDisabled = isFixed || selectedObjectId === null;

  function handleChange(value: string) {
    if (isDisabled || selectedObjectId === null) return;
    updateObjectType(selectedObjectId, value as ObjectType);
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

