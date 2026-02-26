import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";

export default function CanvasRedoButton() {
    return (
        <MenuBarItem label="Redo" shortcut={S["canvas.redo"].shortcut} />
    );
}
