import { create } from "zustand";

interface GlobalTypeState {
    isGlobalType: boolean;
    setGlobalType: (value: boolean) => void;
}

export const useGlobalTypeStore = create<GlobalTypeState>((set) => ({
    isGlobalType: false,
    setGlobalType: (value: boolean) =>
        set(() => ({
            isGlobalType: value,
        })),
}));
