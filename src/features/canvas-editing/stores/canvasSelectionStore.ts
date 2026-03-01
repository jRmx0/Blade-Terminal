import { create } from "zustand";

interface CanvasSelectionState {
    selectedObjectId: number | null;
    selectedVertexIndices: number[];

    selectObject: (id: number) => void;
    clearSelection: () => void;
    selectVertex: (index: number | null) => void;
    toggleVertexSelection: (index: number, ctrl: boolean) => void;
}

export const useCanvasSelectionStore = create<CanvasSelectionState>((set) => ({
    selectedObjectId: null,
    selectedVertexIndices: [],

    selectObject: (id) =>
        set({ selectedObjectId: id, selectedVertexIndices: [] }),

    clearSelection: () =>
        set({ selectedObjectId: null, selectedVertexIndices: [] }),

    selectVertex: (index) =>
        set({ selectedVertexIndices: index !== null ? [index] : [] }),

    toggleVertexSelection: (index, ctrl) =>
        set((state) => {
            if (!ctrl) {
                const alreadySoleSelected =
                    state.selectedVertexIndices.length === 1 && state.selectedVertexIndices[0] === index;
                return { selectedVertexIndices: alreadySoleSelected ? [] : [index] };
            }
            const alreadySelected = state.selectedVertexIndices.includes(index);
            return {
                selectedVertexIndices: alreadySelected
                    ? state.selectedVertexIndices.filter((i) => i !== index)
                    : [...state.selectedVertexIndices, index],
            };
        }),
}));
