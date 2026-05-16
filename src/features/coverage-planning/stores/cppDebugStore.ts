import { create } from "zustand";

interface CppDebugState {
    isDebugMode: boolean;
    isOpen: boolean;
    controlPosition: { x: number; y: number };
    sessionId: string | null;
    totalSteps: number;
    currentStep: number;
    startDebug: () => void;
    stopDebug: () => void;
    setControlPosition: (position: { x: number; y: number }) => void;
    setSessionId: (id: string | null) => void;
    setTotalSteps: (n: number) => void;
    setCurrentStep: (n: number) => void;
}

export const useCppDebugStore = create<CppDebugState>((set) => ({
    isDebugMode: false,
    isOpen: false,
    controlPosition: { x: 16, y: 16 },
    sessionId: null,
    totalSteps: 0,
    currentStep: 0,
    startDebug: () => set({ isDebugMode: true, isOpen: true }),
    stopDebug: () => set({ isDebugMode: false, isOpen: false, sessionId: null, totalSteps: 0, currentStep: 0 }),
    setControlPosition: (position) => set({ controlPosition: position }),
    setSessionId: (id) => set({ sessionId: id }),
    setTotalSteps: (n) => set({ totalSteps: n }),
    setCurrentStep: (n) => set({ currentStep: n }),
}));
