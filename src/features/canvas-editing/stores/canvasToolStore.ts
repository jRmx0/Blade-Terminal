import { create } from "zustand";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";

interface CanvasToolState {
    activeTool: ActiveTool | null;
    setActiveTool: (tool: ActiveTool | null) => void;
}

export const useCanvasToolStore = create<CanvasToolState>((set) => ({
    activeTool: null,
    setActiveTool: (tool) => set({ activeTool: tool }),
}));
