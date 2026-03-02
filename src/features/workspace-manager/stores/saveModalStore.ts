import { create } from "zustand";
import { useSaveStatusStore } from "@/stores/saveStatusStore";
import { performSave } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasSave";
import { useSaveModeStore } from "@/stores/saveModeStore";
import { useEnvStore } from "@/stores/envStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SaveModalState {
    isOpen: boolean;
    pendingAction: (() => Promise<void>) | null;

    /**
     * If there are unsaved changes, opens the SaveModal with the given action
     * as the pending continuation. Otherwise runs the action immediately.
     */
    requestWithSaveGuard: (action: () => Promise<void>) => void;

    saveAndContinue: () => Promise<void>;
    discardAndContinue: () => Promise<void>;
    cancel: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSaveModalStore = create<SaveModalState>()((set, get) => ({
    isOpen: false,
    pendingAction: null,

    requestWithSaveGuard: (action) => {
        const { status } = useSaveStatusStore.getState();
        if (status === "unsaved") {
            set({ isOpen: true, pendingAction: action });
        } else {
            action().catch(console.error);
        }
    },

    saveAndContinue: async () => {
        await performSave();
        const { mode, setMode } = useSaveModeStore.getState();
        if (mode === "session") setMode("manual");

        const { pendingAction } = get();
        set({ isOpen: false, pendingAction: null });
        await pendingAction?.();
    },

    discardAndContinue: async () => {
        useEnvStore.getState().clearEnvDirty();
        useCanvasObjectStore.getState().clearDirty();

        const { pendingAction } = get();
        set({ isOpen: false, pendingAction: null });
        await pendingAction?.();
    },

    cancel: () => set({ isOpen: false, pendingAction: null }),
}));
