import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";

export default function AddZoneButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const isActive = activeTool === "addZone";
  const isDisabled = activeTool !== null && !isActive;

  return (
    <ToolBarButton
      title="Add Zone (Z)"
      icon="rectangle_add"
      isActive={isActive}
      isDisabled={isDisabled}
      onClick={() => setActiveTool(isActive ? null : "addZone")}
    />
  );
}
