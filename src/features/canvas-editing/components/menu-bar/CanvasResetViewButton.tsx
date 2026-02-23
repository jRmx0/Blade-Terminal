import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";

export default function CanvasResetViewButton() {
  const resetView = useCanvasViewStore((s) => s.resetView);

  return <MenuBarItem label="Reset View" onClick={resetView} />;
}
