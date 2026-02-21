import { create } from "zustand";

// TODO: Remove mock data - replace with real format options from backend
const MOCK_FORMATS = [
    { value: "polygon", label: "Polygon" },
    { value: "grid", label: "Grid" },
];

interface FormatState {
    selectedFormat: string;
    setSelectedFormat: (format: string) => void;
    formats: Array<{ value: string; label: string }>;
}

export const useFormatStore = create<FormatState>((set) => ({
    selectedFormat: "polygon",
    formats: MOCK_FORMATS,
    setSelectedFormat: (format: string) =>
        set(() => ({
            selectedFormat: format,
        })),
}));
