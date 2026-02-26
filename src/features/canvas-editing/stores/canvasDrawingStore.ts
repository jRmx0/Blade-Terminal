import { create } from "zustand";

interface CanvasDrawingState {
    drawingPoints: { x: number; y: number }[];
    mousePos: { x: number; y: number } | null;

    setDrawingPoints: (points: { x: number; y: number }[]) => void;
    appendDrawingPoint: (point: { x: number; y: number }) => void;
    setMousePos: (pos: { x: number; y: number } | null) => void;
    cancelDrawing: () => void;
}

export const useCanvasDrawingStore = create<CanvasDrawingState>((set) => ({
    drawingPoints: [],
    mousePos: null,

    setDrawingPoints: (points) => set({ drawingPoints: points }),
    appendDrawingPoint: (point) =>
        set((state) => ({ drawingPoints: [...state.drawingPoints, point] })),
    setMousePos: (pos) => set({ mousePos: pos }),
    cancelDrawing: () => set({ drawingPoints: [], mousePos: null }),
}));
