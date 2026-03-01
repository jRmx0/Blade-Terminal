import { create } from "zustand";

export type SaveMode = "session" | "manual" | "autosave";

interface SaveModeState {
    mode: SaveMode;
    isDirty: boolean;
    setMode: (mode: SaveMode) => void;
    markDirty: () => void;
    markSaved: () => void;
}

export const useSaveModeStore = create<SaveModeState>((set) => ({
    mode: "session",
    isDirty: false,
    setMode: (mode) => set({ mode }),
    markDirty: () => set({ isDirty: true }),
    markSaved: () => set({ isDirty: false }),
}));

/** Getter for use outside React (e.g. inside Zustand store action closures). */
export const getSaveMode = (): SaveMode => useSaveModeStore.getState().mode;

/**
 * Returns whether the current canvas state is considered "saved"
 * based on the active save mode.
 */
export const getIsSaved = (): boolean => {
    const { mode, isDirty } = useSaveModeStore.getState();
    if (mode === "autosave") return true;
    if (mode === "session") return false;
    return !isDirty; // manual
};

// Mark dirty whenever canvas objects change in manual mode.
// Import is deferred to avoid circular module issues.
import("@/features/canvas-editing/stores/canvasObjectStore").then(({ useCanvasObjectStore }) => {
    useCanvasObjectStore.subscribe((state, prev) => {
        if (state.objects !== prev.objects || state.vertices !== prev.vertices) {
            const { mode, markDirty } = useSaveModeStore.getState();
            if (mode === "manual") markDirty();
        }
    });
});
