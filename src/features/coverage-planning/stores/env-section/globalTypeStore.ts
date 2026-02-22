import { create } from "zustand";

// TODO: Remove mock data - replace with real type options from backend
const MOCK_GLOBAL_TYPES = [
    { value: "", label: "" },
    { value: "offline", label: "Off-Line" },
    { value: "online", label: "On-Line" },
    { value: "any (default: offline)", label: "Any (default: Off-Line)" },
    { value: "any (default: online)", label: "Any (default: On-Line)" },
];

interface GlobalTypeState {
    selectedGlobalType: string;
    setSelectedGlobalType: (type: string) => void;
    globalTypes: Array<{ value: string; label: string }>;
}

export const useGlobalTypeStore = create<GlobalTypeState>((set) => ({
    selectedGlobalType: "offline",
    globalTypes: MOCK_GLOBAL_TYPES,
    setSelectedGlobalType: (type: string) =>
        set(() => ({
            selectedGlobalType: type,
        })),
}));
