import { create } from "zustand";
import { useEnvStore } from "@/stores/envStore";
import { copyWorkspace, loadWorkspace } from "@/features/workspace-manager/data/workspaceBridge";
import { useConfirmationModalStore } from "@/stores/confirmationModalStore";
import { useSaveModalStore } from "@/features/workspace-manager/stores/saveModalStore";
import { getAllEnvironments } from "@server/db/environments";
import type { Environment } from "@/types/schemaTypes";

interface CopyWorkspaceModalState {
    isOpen: boolean;
    name: string;
    environments: Environment[];
    isCopying: boolean;
    open: () => Promise<void>;
    close: () => void;
    setName: (name: string) => void;
    copy: () => Promise<void>;
}

export const useCopyWorkspaceModalStore = create<CopyWorkspaceModalState>((set, get) => ({
    isOpen: false,
    name: "",
    environments: [],
    isCopying: false,

    open: async () => {
        const currentName = useEnvStore.getState().env.name;
        const environments = await getAllEnvironments();
        set({ isOpen: true, name: `${currentName} (copy)`, environments, isCopying: false });
    },

    close: () => {
        set({ isOpen: false, name: "", environments: [], isCopying: false });
    },

    setName: (name) => set({ name }),

    copy: async () => {
        if (get().isCopying) return;
        set({ isCopying: true });
        const { name } = get();
        let newId: number;
        try {
            newId = await copyWorkspace(name);
        } catch (err) {
            set({ isCopying: false });
            get().close();
            useConfirmationModalStore.getState().requestConfirmation({
                title: "Copy Failed",
                message: err instanceof Error ? err.message : "An unexpected error occurred.",
                tone: "danger",
                confirmLabel: "Dismiss",
            });
            return;
        }
        set({ isCopying: false });
        get().close();
        useConfirmationModalStore.getState().requestConfirmation({
            title: "Copy Created",
            message: `"${name}" was created. Open it now?`,
            confirmLabel: "Open",
            cancelLabel: "Stay",
            confirmAction: async () => {
                useSaveModalStore.getState().requestWithSaveGuard(async () => {
                    await loadWorkspace(newId);
                });
            },
        });
    },
}));
