import { create } from "zustand";

interface ConfirmationModalState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    secondaryLabel: string | null;
    confirmDisabled: boolean;
    confirmAction: (() => Promise<void>) | null;
    secondaryAction: (() => Promise<void>) | null;

    requestConfirmation: (options: {
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        secondaryLabel?: string;
        confirmDisabled?: boolean;
        confirmAction?: () => Promise<void>;
        secondaryAction?: () => Promise<void>;
    }) => void;
    confirm: () => Promise<void>;
    secondary: () => Promise<void>;
    cancel: () => void;
}

const INITIAL_STATE = {
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    secondaryLabel: null,
    confirmDisabled: false,
    confirmAction: null,
    secondaryAction: null,
};

export const useConfirmationModalStore = create<ConfirmationModalState>()((set, get) => ({
    ...INITIAL_STATE,

    requestConfirmation: ({
        title,
        message,
        confirmLabel = "Confirm",
        cancelLabel = "Cancel",
        secondaryLabel,
        confirmDisabled = false,
        confirmAction = null,
        secondaryAction = null,
    }) => {
        set({
            isOpen: true,
            title,
            message,
            confirmLabel,
            cancelLabel,
            secondaryLabel: secondaryLabel ?? null,
            confirmDisabled,
            confirmAction,
            secondaryAction,
        });
    },

    confirm: async () => {
        const { confirmAction } = get();
        set(INITIAL_STATE);
        await confirmAction?.();
    },

    secondary: async () => {
        const { secondaryAction } = get();
        set(INITIAL_STATE);
        await secondaryAction?.();
    },

    cancel: () => set(INITIAL_STATE),
}));
