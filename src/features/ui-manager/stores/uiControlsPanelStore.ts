import { create } from "zustand";

interface UiControlsPanelState {
    isVisible: boolean;
    isResizing: boolean;
    width: number;
    setVisibility: (visible: boolean) => void;
    setResizing: (resizing: boolean) => void;
    setWidth: (width: number) => void;
}

export const useUiControlsPanelStore = create<UiControlsPanelState>((set) => ({
    isVisible: true,
    isResizing: false,
    width: 320, // Default width in pixels
    setVisibility: (visible: boolean) =>
        set(() => ({
            isVisible: visible,
        })),
    setResizing: (resizing: boolean) =>
        set(() => ({
            isResizing: resizing,
        })),
    setWidth: (width: number) =>
        set(() => ({
            width: width,
        })),
}));
