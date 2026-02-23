import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";

export default function EditButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const isActive = activeTool === "select";
  const isDisabled = activeTool !== null && !isActive;

  return (
    <ToolBarButton
      title="Select / Edit (S)"
      icon="edit_square"
      isActive={isActive}
      isDisabled={isDisabled}
      onClick={() => setActiveTool(isActive ? null : "select")}
    />
  );
}
