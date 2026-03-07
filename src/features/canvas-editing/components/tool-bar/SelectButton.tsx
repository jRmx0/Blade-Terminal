import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useCanvasDrawingStore } from "@/features/canvas-editing/stores/canvasDrawingStore";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";

export default function SelectButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const clearSelection = useCanvasSelectionStore((s) => s.clearSelection);
  const cancelDrawing = useCanvasDrawingStore((s) => s.cancelDrawing);
  const isActive = activeTool === "select";

  return (
    <ToolBarButton
      title="Select"
      shortcut={S["canvas.tool-select"].shortcut}
      icon="edit_square"
      isActive={isActive}
      onClick={() => {
        cancelDrawing();
        if (isActive) clearSelection();
        setActiveTool(isActive ? null : "select");
      }}
    />
  );
}
