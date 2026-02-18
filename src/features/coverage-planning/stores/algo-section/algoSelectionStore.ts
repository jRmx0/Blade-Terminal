import { create } from "zustand";

// TODO: Remove mock data - replace with real algorithm options from backend
const MOCK_ALGORITHMS = [
    { value: "grid", label: "Grid Coverage" },
    { value: "spiral", label: "Spiral Coverage" },
    { value: "sweep", label: "Sweep Coverage" },
];

interface AlgoSelectionState {
    selectedAlgo: string;
    setSelectedAlgo: (algo: string) => void;
    algorithms: Array<{ value: string; label: string }>;
}

export const useAlgoSelectionStore = create<AlgoSelectionState>((set) => ({
    selectedAlgo: "grid",
    algorithms: MOCK_ALGORITHMS,
    setSelectedAlgo: (algo: string) =>
        set(() => ({
            selectedAlgo: algo,
        })),
}));
