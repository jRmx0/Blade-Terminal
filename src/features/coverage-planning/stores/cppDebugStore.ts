import { create } from "zustand";

interface CppDebugState {
    isDebugMode: boolean;
    isOpen: boolean;
    controlPosition: { x: number; y: number };
    startDebug: () => void;
    stopDebug: () => void;
    setControlPosition: (position: { x: number; y: number }) => void;
}

export const useCppDebugStore = create<CppDebugState>((set) => ({
    isDebugMode: false,
    isOpen: false,
    controlPosition: { x: 16, y: 16 },
    startDebug: () => set({ isDebugMode: true, isOpen: true }),
    stopDebug: () => set({ isDebugMode: false, isOpen: false }),
    setControlPosition: (position) => set({ controlPosition: position }),
}));
