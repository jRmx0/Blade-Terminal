import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";

export default function CanvasUndoButton() {
    return (
        <MenuBarItem label="Undo" shortcut={S["canvas.undo"].shortcut} />
    );
}
