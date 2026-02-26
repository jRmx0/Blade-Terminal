import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";

export default function DeleteButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const { selectedObjectId, selectedVertexIndex, clearSelection, deleteObject, deleteVertex } =
    useCanvasObjectStore();

  const isActive = activeTool === "delete";
  const hasSelection = selectedObjectId !== null;
  const isInSelectModeWithSelection = activeTool === "select" && hasSelection;
  const isDisabled = activeTool !== null && !isActive && !isInSelectModeWithSelection;

  function handleClick() {
    if (isActive) {
      clearSelection();
      setActiveTool(null);
      return;
    }
    if (isInSelectModeWithSelection) {
      if (selectedVertexIndex !== null) {
        deleteVertex(selectedObjectId!, selectedVertexIndex);
      } else {
        deleteObject(selectedObjectId!);
      }
      return;
    }
    setActiveTool("delete");
  }

  return (
    <ToolBarButton
      title="Delete"
      shortcut={S["canvas.tool-delete"].shortcut}
      icon="delete"
      isActive={isActive}
      isDisabled={isDisabled}
      onClick={handleClick}
    />
  );
}
