import { create } from "zustand";
import type { Object, Vertex } from "@/types/schemaTypes";
import { sameVertex } from "@/features/canvas-editing/utils/canvasObjectUtils";

interface CanvasSelectionState {
    selectedObject: Object | null;
    selectedVertices: Vertex[];

    selectObject: (obj: Object) => void;
    clearSelection: () => void;
    selectVertex: (vertex: Vertex | null) => void;
    toggleVertexSelection: (vertex: Vertex, ctrl: boolean) => void;
}

export const useCanvasSelectionStore = create<CanvasSelectionState>((set) => ({
    selectedObject: null,
    selectedVertices: [],

    selectObject: (obj) =>
        set({ selectedObject: obj, selectedVertices: [] }),

    clearSelection: () =>
        set({ selectedObject: null, selectedVertices: [] }),

    selectVertex: (vertex) =>
        set({ selectedVertices: vertex !== null ? [vertex] : [] }),

    toggleVertexSelection: (vertex, ctrl) =>
        set((state) => {
            if (!ctrl) {
                const alreadySoleSelected =
                    state.selectedVertices.length === 1 && sameVertex(state.selectedVertices[0]!, vertex);
                return { selectedVertices: alreadySoleSelected ? [] : [vertex] };
            }
            const alreadySelected = state.selectedVertices.some((sv) => sameVertex(sv, vertex));
            return {
                selectedVertices: alreadySelected
                    ? state.selectedVertices.filter((sv) => !sameVertex(sv, vertex))
                    : [...state.selectedVertices, vertex],
            };
        }),
}));
