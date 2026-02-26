import { create } from "zustand";
import { type EnvFormat, ENV_FORMAT, ENV_FORMAT_OPTIONS } from "@/config/enums";

interface FormatState {
    selectedFormat: EnvFormat;
    setSelectedFormat: (format: EnvFormat) => void;
    formats: typeof ENV_FORMAT_OPTIONS;
}

export const useFormatStore = create<FormatState>((set) => ({
    selectedFormat: ENV_FORMAT.POLYGON,
    formats: ENV_FORMAT_OPTIONS,
    setSelectedFormat: (format: EnvFormat) => set({ selectedFormat: format }),
}));
