import { create } from "zustand";

interface CanvasGeneratorFloatingControlState {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
}

export const useCanvasGeneratorFloatingControlStore = create<CanvasGeneratorFloatingControlState>((set) => ({
    isOpen: false,
    setOpen: (open) => set({ isOpen: open }),
}));
