import { useShortcut } from "./useShortcut";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";
import { useUiControlsPanelStore } from "@/features/ui-manager/stores/uiControlsPanelStore";
import { useUiInspectorPanelStore } from "@/features/ui-manager/stores/uiInspectorPanelStore";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";

/**
 * Registers all shortcuts that are scoped to the Workbench.
 * Mount this once inside WorkbenchWindow — shortcuts are active for
 * as long as the workbench is rendered and automatically cleaned up on unmount.
 */
export function useWorkbenchShortcuts() {
    useShortcut("controls.toggle", S["controls.toggle"].keys!, () =>
        useUiControlsPanelStore
            .getState()
            .setVisibility(!useUiControlsPanelStore.getState().isVisible),
    );

    useShortcut("inspector.toggle", S["inspector.toggle"].keys!, () =>
        useUiInspectorPanelStore
            .getState()
            .setVisibility(!useUiInspectorPanelStore.getState().isVisible),
    );

    useShortcut("canvas.reset-view", S["canvas.reset-view"].keys!, () =>
        useCanvasViewStore.getState().resetView(),
    );
}
