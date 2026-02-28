import { useShortcut } from "./useShortcut";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";
import { useWorkspacePickerStore } from "@/features/workspace-manager/stores/workspacePickerStore";
import { useUiControlsPanelStore } from "@/features/ui-manager/stores/uiControlsPanelStore";
import { useUiInspectorPanelStore } from "@/features/ui-manager/stores/uiInspectorPanelStore";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasHistoryStore } from "@/features/canvas-editing/stores/canvasHistoryStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useCanvasDrawingStore } from "@/features/canvas-editing/stores/canvasDrawingStore";

/**
 * Registers all shortcuts that are scoped to the Workbench.
 * Mount this once inside WorkbenchWindow — shortcuts are active for
 * as long as the workbench is rendered and automatically cleaned up on unmount.
 */
export function useWorkbenchShortcuts() {
    useShortcut("workspace.open", S["workspace.open"].keys, () =>
        useWorkspacePickerStore.getState().open(),
    );

    useShortcut("controls.toggle", S["controls.toggle"].keys, () =>
        useUiControlsPanelStore
            .getState()
            .setVisibility(!useUiControlsPanelStore.getState().isVisible),
    );

    useShortcut("inspector.toggle", S["inspector.toggle"].keys, () =>
        useUiInspectorPanelStore
            .getState()
            .setVisibility(!useUiInspectorPanelStore.getState().isVisible),
    );

    useShortcut("canvas.reset-view", S["canvas.reset-view"].keys, () =>
        useCanvasViewStore.getState().resetView(),
    );

    useShortcut("canvas.tool-select", S["canvas.tool-select"].keys, () => {
        const { activeTool, setActiveTool } = useCanvasToolStore.getState();
        const { clearSelection } = useCanvasSelectionStore.getState();
        useCanvasDrawingStore.getState().cancelDrawing();
        clearSelection();
        setActiveTool(activeTool === "select" ? null : "select");
    });

    useShortcut("canvas.tool-add-zone", S["canvas.tool-add-zone"].keys, () => {
        const { activeTool, setActiveTool } = useCanvasToolStore.getState();
        const { clearSelection } = useCanvasSelectionStore.getState();
        useCanvasDrawingStore.getState().cancelDrawing();
        clearSelection();
        setActiveTool(activeTool === "addZone" ? null : "addZone");
    });

    useShortcut("canvas.tool-add-obstacle", S["canvas.tool-add-obstacle"].keys, () => {
        const { activeTool, setActiveTool } = useCanvasToolStore.getState();
        const { clearSelection } = useCanvasSelectionStore.getState();
        useCanvasDrawingStore.getState().cancelDrawing();
        clearSelection();
        setActiveTool(activeTool === "addObstacle" ? null : "addObstacle");
    });

    useShortcut("canvas.tool-delete", S["canvas.tool-delete"].keys, () => {
        const { activeTool, setActiveTool } = useCanvasToolStore.getState();
        const { selectedObjectId, selectedVertexIndices, clearSelection, selectVertex } =
            useCanvasSelectionStore.getState();
        const { deleteObject, deleteVertices } = useCanvasObjectStore.getState();
        if (activeTool === "select" && selectedObjectId !== null) {
            if (selectedVertexIndices.length > 0) {
                deleteVertices(selectedObjectId, selectedVertexIndices);
                selectVertex(null);
            } else {
                deleteObject(selectedObjectId);
                clearSelection();
            }
            return;
        }
        useCanvasDrawingStore.getState().cancelDrawing();
        clearSelection();
        setActiveTool(activeTool === "delete" ? null : "delete");
    });

    useShortcut("canvas.undo", S["canvas.undo"].keys, () =>
        useCanvasHistoryStore.getState().undo(),
    );

    useShortcut("canvas.redo", S["canvas.redo"].keys, () =>
        useCanvasHistoryStore.getState().redo(),
    );
}
