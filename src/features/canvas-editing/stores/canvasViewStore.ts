import { create } from "zustand";

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 8;

interface CanvasViewState {
    position: { x: number; y: number };
    scale: number;
    gridVisible: boolean;
    setPosition: (position: { x: number; y: number }) => void;
    setScale: (scale: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
    toggleGrid: () => void;
}

export const useCanvasViewStore = create<CanvasViewState>((set, get) => ({
    position: { x: 0, y: 0 },
    scale: 1,
    gridVisible: true,

    setPosition: (position) => set({ position }),

    setScale: (scale) =>
        set({ scale: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale)) }),

    zoomIn: () =>
        set((state) => ({
            scale: Math.min(ZOOM_MAX, Math.round((state.scale + ZOOM_STEP) * 100) / 100),
        })),

    zoomOut: () =>
        set((state) => ({
            scale: Math.max(ZOOM_MIN, Math.round((state.scale - ZOOM_STEP) * 100) / 100),
        })),

    resetView: () => set({ position: { x: 0, y: 0 }, scale: 1 }),

    toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),
}));
