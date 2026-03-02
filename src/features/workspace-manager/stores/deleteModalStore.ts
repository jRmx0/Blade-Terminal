import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeleteModalState {
    isOpen: boolean;
    envName: string;
    pendingAction: (() => Promise<void>) | null;

    /** Opens the confirmation modal. If confirmed, runs the given action. */
    requestDelete: (envName: string, action: () => Promise<void>) => void;

    confirm: () => Promise<void>;
    cancel: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDeleteModalStore = create<DeleteModalState>()((set, get) => ({
    isOpen: false,
    envName: "",
    pendingAction: null,

    requestDelete: (envName, action) => {
        set({ isOpen: true, envName, pendingAction: action });
    },

    confirm: async () => {
        const { pendingAction } = get();
        set({ isOpen: false, envName: "", pendingAction: null });
        await pendingAction?.();
    },

    cancel: () => set({ isOpen: false, envName: "", pendingAction: null }),
}));
