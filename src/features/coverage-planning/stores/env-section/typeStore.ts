import { create } from "zustand";

// TODO: Remove mock data - replace with real type options from backend
const MOCK_TYPES = [
    { value: "", label: "" },
    { value: "offline", label: "Off-Line" },
    { value: "online", label: "On-Line" },
    { value: "any (default: offline)", label: "Any (default: Off-Line)" },
    { value: "any (default: online)", label: "Any (default: On-Line)" },
];

interface TypeState {
    selectedType: string;
    setSelectedType: (type: string) => void;
    types: Array<{ value: string; label: string }>;
}

export const useTypeStore = create<TypeState>((set) => ({
    selectedType: "offline",
    types: MOCK_TYPES,
    setSelectedType: (type: string) =>
        set(() => ({
            selectedType: type,
        })),
}));
