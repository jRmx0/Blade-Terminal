import { create } from "zustand";

interface PathOverlapState {
    pathOverlap: number;
    setPathOverlap: (overlap: number) => void;
}

export const usePathOverlapStore = create<PathOverlapState>((set) => ({
    pathOverlap: 5,
    setPathOverlap: (overlap: number) =>
        set(() => ({
            pathOverlap: overlap,
        })),
}));
