import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import { WORKBENCH_SHORTCUTS } from "@/config/shortcut-manager/workbenchShortcutsConfig";

const { shortcut } = WORKBENCH_SHORTCUTS["canvas.reset-view"];

export default function CanvasResetViewButton() {
  const resetView = useCanvasViewStore((s) => s.resetView);

  return (
    <MenuBarItem label="Reset View" shortcut={shortcut} onClick={resetView} />
  );
}
