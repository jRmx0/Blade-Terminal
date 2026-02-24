import { create } from "zustand";

interface UiInspectorPanelState {
    isVisible: boolean;
    width: number;
    setVisibility: (visible: boolean) => void;
    setWidth: (width: number) => void;
}

export const useUiInspectorPanelStore = create<UiInspectorPanelState>(
    (set) => ({
        isVisible: true,
        width: 300,
        setVisibility: (visible) => set({ isVisible: visible }),
        setWidth: (width) => set({ width }),
    }),
);
