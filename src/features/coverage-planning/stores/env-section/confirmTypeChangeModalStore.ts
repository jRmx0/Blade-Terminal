import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfirmTypeChangeModalState {
    isOpen: boolean;
    message: string;
    pendingAction: (() => void) | null;

    /**
     * Opens the confirmation modal. If confirmed, `action` is called synchronously.
     * @param message  Human-readable description of what will change.
     * @param action   Callback executed when the user clicks "Confirm".
     */
    requestConfirm: (message: string, action: () => void) => void;

    confirm: () => void;
    cancel: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useConfirmTypeChangeModalStore = create<ConfirmTypeChangeModalState>()((set, get) => ({
    isOpen: false,
    message: "",
    pendingAction: null,

    requestConfirm: (message, action) => {
        set({ isOpen: true, message, pendingAction: action });
    },

    confirm: () => {
        const { pendingAction } = get();
        set({ isOpen: false, message: "", pendingAction: null });
        pendingAction?.();
    },

    cancel: () => set({ isOpen: false, message: "", pendingAction: null }),
}));
