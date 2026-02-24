import { create } from "zustand";

interface UiControlsPanelState {
    isVisible: boolean;
    width: number;
    setVisibility: (visible: boolean) => void;
    setWidth: (width: number) => void;
}

export const useUiControlsPanelStore = create<UiControlsPanelState>((set) => ({
    isVisible: true,
    width: 300, // Default width in pixels
    setVisibility: (visible) => set({ isVisible: visible }),
    setWidth: (width) => set({ width }),
}));
