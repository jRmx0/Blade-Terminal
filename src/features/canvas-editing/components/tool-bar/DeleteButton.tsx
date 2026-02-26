import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";

export default function DeleteButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const clearSelection = useCanvasObjectStore((s) => s.clearSelection);
  const isActive = activeTool === "delete";
  const isDisabled = activeTool !== null && !isActive;

  return (
    <ToolBarButton
      title="Delete Objects (D)"
      icon="delete"
      isActive={isActive}
      isDisabled={isDisabled}
      onClick={() => {
        if (isActive) clearSelection();
        setActiveTool(isActive ? null : "delete");
      }}
    />
  );
}
