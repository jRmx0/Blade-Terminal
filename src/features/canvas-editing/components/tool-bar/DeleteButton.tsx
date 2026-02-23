import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";

export default function DeleteButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const isActive = activeTool === "delete";
  const isDisabled = activeTool !== null && !isActive;

  return (
    <ToolBarButton
      title="Delete Objects (D)"
      icon="delete"
      isActive={isActive}
      isDisabled={isDisabled}
      onClick={() => setActiveTool(isActive ? null : "delete")}
    />
  );
}
