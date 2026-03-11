import { create } from "zustand";

export type ConfirmationModalTone = "default" | "warning" | "danger";

interface ConfirmationModalState {
    isOpen: boolean;
    title: string;
    message: string;
    tone: ConfirmationModalTone;
    confirmLabel: string;
    cancelLabel: string;
    secondaryLabel: string | null;
    confirmDisabled: boolean;
    confirmAction: (() => Promise<void>) | null;
    secondaryAction: (() => Promise<void>) | null;

    requestConfirmation: (options: {
        title: string;
        message: string;
        tone?: ConfirmationModalTone;
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
    tone: "default" as ConfirmationModalTone,
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
        tone = "default",
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
            tone,
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
