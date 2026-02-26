import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";

export default function UndoButton() {
    return (
        <ToolBarButton
            title="Undo"
            shortcut={S["canvas.undo"].shortcut}
            icon="undo"
        />
    );
}
