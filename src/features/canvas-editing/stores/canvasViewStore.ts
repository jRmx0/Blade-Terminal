import { create } from "zustand";
import { ZOOM_STEP, ZOOM_MIN, ZOOM_MAX } from "@/config/canvas-editing/canvasConfig";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";

interface CanvasViewState {
    position: Point;
    scale: number;
    setPosition: (position: Point) => void;
    setScale: (scale: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
}

export const useCanvasViewStore = create<CanvasViewState>((set) => ({
    position: { x: 0, y: 0 },
    scale: 1,

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
}));
