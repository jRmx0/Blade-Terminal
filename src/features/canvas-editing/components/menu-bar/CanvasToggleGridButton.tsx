import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";

export default function CanvasToggleGridButton() {
  const { gridVisible, toggleGrid } = useCanvasViewStore();

  return (
    <MenuBarItem
      label="Toggle Grid"
      hasCheckmark
      defaultChecked={gridVisible}
      onClick={toggleGrid}
    />
  );
}
