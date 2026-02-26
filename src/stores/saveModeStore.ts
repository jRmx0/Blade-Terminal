import { create } from "zustand";

export type SaveMode = "session" | "manual" | "autosave";

interface SaveModeState {
    mode: SaveMode;
    setMode: (mode: SaveMode) => void;
}

export const useSaveModeStore = create<SaveModeState>((set) => ({
    mode: "session",
    setMode: (mode) => set({ mode }),
}));

/** Getter for use outside React (e.g. inside Zustand store action closures). */
export const getSaveMode = (): SaveMode => useSaveModeStore.getState().mode;
