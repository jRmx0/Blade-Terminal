import { create } from "zustand";

interface CanvasFloatingControlState {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
}

export const useCanvasFloatingControlStore = create<CanvasFloatingControlState>((set) => ({
    isOpen: true,
    setOpen: (open) => set({ isOpen: open }),
}));
