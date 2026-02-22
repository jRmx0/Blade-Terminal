import { create } from "zustand";

// TODO: Remove mock data - replace with real type options from backend
const MOCK_OBJECT_TYPES = [
    { value: "", label: "" },
    { value: "offline", label: "Off-Line" },
    { value: "online", label: "On-Line" },
];

interface ObjectTypeState {
    selectedObjectType: string;
    setSelectedObjectType: (type: string) => void;
    objectTypes: Array<{ value: string; label: string }>;
}

export const useObjectTypeStore = create<ObjectTypeState>((set) => ({
    selectedObjectType: "offline",
    objectTypes: MOCK_OBJECT_TYPES,
    setSelectedObjectType: (type: string) =>
        set(() => ({
            selectedObjectType: type,
        })),
}));
