import { create } from "zustand";
import { type GlobalType, GLOBAL_TYPE, GLOBAL_TYPE_OPTIONS } from "@/config/enums";

interface GlobalTypeState {
    selectedGlobalType: GlobalType;
    setSelectedGlobalType: (type: GlobalType) => void;
    globalTypes: typeof GLOBAL_TYPE_OPTIONS;
}

export const useGlobalTypeStore = create<GlobalTypeState>((set) => ({
    selectedGlobalType: GLOBAL_TYPE.OFFLINE,
    globalTypes: GLOBAL_TYPE_OPTIONS,
    setSelectedGlobalType: (type: GlobalType) => set({ selectedGlobalType: type }),
}));
