import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasDrawingStore } from "@/features/canvas-editing/stores/canvasDrawingStore";

export default function AddZoneButton() {
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const cancelDrawing = useCanvasDrawingStore((s) => s.cancelDrawing);
  const isActive = activeTool === "addZone";
  const isDisabled = activeTool !== null && !isActive;

  return (
    <ToolBarButton
      title="Add Zone (Z)"
      icon="rectangle_add"
      isActive={isActive}
      isDisabled={isDisabled}
      onClick={() => {
        if (isActive) cancelDrawing();
        setActiveTool(isActive ? null : "addZone");
      }}
    />
  );
}
