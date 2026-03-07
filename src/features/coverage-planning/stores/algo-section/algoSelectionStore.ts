import { create } from "zustand";

// TODO: Remove mock data - replace with real algorithm options from backend
const MOCK_ALGORITHMS = [
    { value: "bcd", label: "Boustrophedon Cellular Decomposition" },
];

interface AlgoSelectionState {
    selectedAlgo: string;
    setSelectedAlgo: (algo: string) => void;
    algorithms: Array<{ value: string; label: string }>;
}

export const useAlgoSelectionStore = create<AlgoSelectionState>((set) => ({
    selectedAlgo: "bcd",
    algorithms: MOCK_ALGORITHMS,
    setSelectedAlgo: (algo: string) =>
        set(() => ({
            selectedAlgo: algo,
        })),
}));
