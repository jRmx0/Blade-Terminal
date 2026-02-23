import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";

export default function CanvasZoomInButton() {
  const zoomIn = useCanvasViewStore((s) => s.zoomIn);

  return (
    <MenuBarItem label="Zoom In" shortcut={["Ctrl", "+"]} onClick={zoomIn} />
  );
}
