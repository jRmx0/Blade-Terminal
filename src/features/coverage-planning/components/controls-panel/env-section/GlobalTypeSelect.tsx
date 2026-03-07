import { useEnvStore } from "@/stores/envStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useConfirmTypeChangeModalStore } from "@/features/coverage-planning/stores/env-section/confirmTypeChangeModalStore";
import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import {
  GLOBAL_TYPE_OPTIONS,
  isGlobalTypeFixed,
  defaultObjectTypeForGlobal,
  type GlobalType,
} from "@/config/db-ops/enums";

export default function GlobalTypeSelection() {
  const type = useEnvStore((s) => s.env.type);
  const setType = useEnvStore((s) => s.setType);
  const objects = useCanvasObjectStore((s) => s.objects);
  const updateObjectsType = useCanvasObjectStore((s) => s.updateObjectsType);
  const requestConfirm = useConfirmTypeChangeModalStore((s) => s.requestConfirm);

  function handleChange(newValue: string) {
    const newType = newValue as GlobalType;

    // Only bulk-update objects when switching to a fixed (non-any) type.
    if (isGlobalTypeFixed(newType)) {
      const newDefaultType = defaultObjectTypeForGlobal(newType);
      const mismatchCount = objects.filter((o) => o.type !== newDefaultType).length;

      if (mismatchCount > 0) {
        const typeLabel = newDefaultType === "online" ? "On-Line" : "Off-Line";
        requestConfirm(
          `${mismatchCount} object${mismatchCount !== 1 ? "s" : ""} will be updated to "${typeLabel}" to match the new global type. Continue?`,
          () => {
            updateObjectsType(newDefaultType);
            setType(newType);
          },
        );
        return;
      }

      // All objects are already correct type or canvas is empty – bulk‑set silently.
      updateObjectsType(newDefaultType);
    }

    setType(newType);
  }

  return (
    <ControlsPanelSectionSelect
      label="Global Type"
      value={type}
      onChange={handleChange}
      options={GLOBAL_TYPE_OPTIONS}
    />
  );
}

