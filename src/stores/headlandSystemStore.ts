import { create } from "zustand";

interface HeadlandSystemState {
    enabled: boolean;
    width: string;
    setEnabled: (enabled: boolean) => void;
    setWidth: (width: string) => void;
}

/**
 * System-level headland controls (frontend-owned, not provider metadata-owned).
 * Defaults follow BCD behavior: Headland enabled by default; width auto-resolves
 * from Path Width / 2 when left empty.
 */
export const useHeadlandSystemStore = create<HeadlandSystemState>((set) => ({
    enabled: true,
    width: "",
    setEnabled: (enabled) => set({ enabled }),
    setWidth: (width) => set({ width }),
}));
