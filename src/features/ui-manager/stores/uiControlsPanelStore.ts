import { create } from "zustand";

interface UiControlsPanelState {
    isVisible: boolean;
    width: number;
    setVisibility: (visible: boolean) => void;
    setWidth: (width: number) => void;
}

export const useUiControlsPanelStore = create<UiControlsPanelState>((set) => ({
    isVisible: true,
    width: 320, // Default width in pixels
    setVisibility: (visible: boolean) =>
        set(() => ({
            isVisible: visible,
        })),
    setWidth: (width: number) =>
        set(() => ({
            width: width,
        })),
}));
