import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";

export default function EditButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const clearSelection = useCanvasObjectStore((s) => s.clearSelection);
  const isActive = activeTool === "select";
  const isDisabled = activeTool !== null && !isActive;

  return (
    <ToolBarButton
      title="Select / Edit (S)"
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
