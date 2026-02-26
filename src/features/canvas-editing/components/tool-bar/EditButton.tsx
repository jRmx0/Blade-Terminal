import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";

export default function EditButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const clearSelection = useCanvasObjectStore((s) => s.clearSelection);
  const isActive = activeTool === "select";
  const isDisabled = activeTool !== null && !isActive;

  return (
    <ToolBarButton
      title="Select / Edit"
      shortcut={S["canvas.tool-select"].shortcut}
      icon="edit_square"
      isActive={isActive}
      isDisabled={isDisabled}
      onClick={() => {
        if (isActive) clearSelection();
        setActiveTool(isActive ? null : "select");
      }}
    />
  );
}
