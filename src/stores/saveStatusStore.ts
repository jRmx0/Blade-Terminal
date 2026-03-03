import { create } from "zustand";
import { useEnvStore } from "@/stores/envStore";
import { useSaveModeStore } from "@/stores/saveModeStore";
import { useCanvasObjectStore, selectIsDirty } from "@/features/canvas-editing/stores/canvasObjectStore";
import { saveCanvas } from "@/features/canvas-editing/data/canvasBridge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SaveStatus = "nothing_to_save" | "unsaved" | "saved";

interface SaveStatusState {
    status: SaveStatus;
    save: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Derived status computation (outside React)
// ---------------------------------------------------------------------------

function computeStatus(): SaveStatus {
    const { isEnvDirty } = useEnvStore.getState();
    const isCanvasDirty = selectIsDirty(useCanvasObjectStore.getState());
    const { mode } = useSaveModeStore.getState();

    const isDirty = isEnvDirty || isCanvasDirty;

    if (isDirty && mode !== "autosave") return "unsaved";
    if (mode === "autosave" || (mode === "manual" && !isDirty)) return "saved";
    // session mode, nothing changed yet
    return "nothing_to_save";
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSaveStatusStore = create<SaveStatusState>()(() => ({
    status: computeStatus(),

    save: async () => {
        await saveCanvas();
        const { mode, setMode } = useSaveModeStore.getState();
        if (mode === "session") setMode("manual");
    },
}));

// ---------------------------------------------------------------------------
// Subscriptions — keep status in sync with source stores
// ---------------------------------------------------------------------------

function syncStatus(): void {
    useSaveStatusStore.setState({ status: computeStatus() });
}

useEnvStore.subscribe(syncStatus);
useCanvasObjectStore.subscribe(syncStatus);
useSaveModeStore.subscribe(syncStatus);
