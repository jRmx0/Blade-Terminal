import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";

export default function AddObstacleButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const isActive = activeTool === "addObstacle";
  const isDisabled = activeTool !== null && !isActive;

  return (
    <ToolBarButton
      title="Add Obstacle (O)"
      icon="add_triangle"
      isActive={isActive}
      isDisabled={isDisabled}
      onClick={() => setActiveTool(isActive ? null : "addObstacle")}
    />
  );
}
