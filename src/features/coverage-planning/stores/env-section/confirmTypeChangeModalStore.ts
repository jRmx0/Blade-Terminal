import { create } from "zustand";
import { useConfirmationModalStore } from "@/stores/confirmationModalStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfirmTypeChangeModalState {
    requestConfirm: (message: string, action: () => void) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useConfirmTypeChangeModalStore = create<ConfirmTypeChangeModalState>()(() => ({
    requestConfirm: (message, action) => {
        useConfirmationModalStore.getState().requestConfirmation({
            title: "Update object types",
            message,
            confirmLabel: "Confirm",
            cancelLabel: "Cancel",
            confirmAction: async () => {
                action();
            },
        });
    },
}));
