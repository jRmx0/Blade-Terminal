import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";

export default function EditButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const clearSelection = useCanvasSelectionStore((s) => s.clearSelection);
  const isActive = activeTool === "select";
  const isDisabled = activeTool !== null && !isActive;

  return (
    <ToolBarButton
      title="Select"
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
