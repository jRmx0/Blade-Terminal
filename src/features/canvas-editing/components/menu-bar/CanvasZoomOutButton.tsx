import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";

export default function CanvasZoomOutButton() {
  const zoomOut = useCanvasViewStore((s) => s.zoomOut);

  return (
    <MenuBarItem label="Zoom Out" shortcut={["Ctrl", "-"]} onClick={zoomOut} />
  );
}
