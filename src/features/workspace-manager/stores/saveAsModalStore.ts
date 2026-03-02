import { create } from "zustand";
import type { Environment } from "@/types/envTypes";
import { getAllEnvironments, getNextEnvironmentId, saveEnvironment } from "@server/db/environments";
import { deleteEnvObjectsByEnvironment, saveEnvObjects } from "@server/db/env-objects";
import { saveEnvVertices } from "@server/db/env-vertices";
import { useEnvStore } from "@/stores/envStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";

interface SaveAsModalState {
    isOpen: boolean;
    environments: Environment[];
    name: string;
    /** The name the user typed before picking an overwrite target. Restored on deselect. */
    customName: string;
    /** When set, the save-as will overwrite this existing env instead of creating a new one. */
    selectedEnvId: number | null;
    isSaving: boolean;
    open: () => Promise<void>;
    close: () => void;
    setName: (name: string) => void;
    selectEnv: (id: number) => void;
    save: () => Promise<void>;
}

export const useSaveAsModalStore = create<SaveAsModalState>((set, get) => ({
    isOpen: false,
    environments: [],
    name: "",
    customName: "",
    selectedEnvId: null,
    isSaving: false,

    open: async () => {
        const currentName = useEnvStore.getState().env.name;
        const environments = await getAllEnvironments();
        set({
            isOpen: true,
            environments,
            name: currentName,
            customName: currentName,
            selectedEnvId: null,
            isSaving: false,
        });
    },

    close: () => {
        set({ isOpen: false, environments: [], name: "", customName: "", selectedEnvId: null, isSaving: false });
    },

    // Typing always deselects — user is switching to "new workspace" mode.
    setName: (name) => set({ name, customName: name, selectedEnvId: null }),

    selectEnv: (id) => {
        set((state) => {
            if (state.selectedEnvId === id) {
                // Deselect — restore the last name the user typed.
                return { selectedEnvId: null, name: state.customName };
            }
            const env = state.environments.find((e) => e.id === id);
            // Fill name with the selected workspace's name; keep customName for restore on deselect.
            return { selectedEnvId: id, name: env?.name ?? state.name };
        });
    },

    save: async () => {
        if (get().isSaving) return;
        set({ isSaving: true });

        try {
            const { name, selectedEnvId } = get();
            const { env } = useEnvStore.getState();
            const { objects, vertices } = useCanvasObjectStore.getState();

            const isOverwrite = selectedEnvId !== null;
            const targetId = isOverwrite ? selectedEnvId : await getNextEnvironmentId();

            const targetEnv: Environment = { ...env, id: targetId, name };

            if (isOverwrite) {
                // Clear old objects for the target env so stale entries don't persist after load.
                await deleteEnvObjectsByEnvironment(targetId);
            }

            const targetObjects = objects.map((o) => ({ ...o, environmentId: targetId }));

            await Promise.all([
                saveEnvironment(targetEnv),
                targetObjects.length > 0 ? saveEnvObjects(targetObjects) : Promise.resolve(),
                vertices.length > 0 ? saveEnvVertices(vertices) : Promise.resolve(),
            ]);

            // Switch to the newly saved env — this resets dirty state and loads from DB.
            await useEnvStore.getState().load(targetId);
        } finally {
            set({ isSaving: false });
        }

        get().close();
    },
}));
