import { create } from "zustand";

interface PerformanceMonitorModalState {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

export const usePerformanceMonitorModalStore = create<PerformanceMonitorModalState>()((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
}));
