import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";

export default function RedoButton() {
    return (
        <ToolBarButton
            title="Redo"
            shortcut={S["canvas.redo"].shortcut}
            icon="redo"
        />
    );
}
