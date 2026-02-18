import { create } from "zustand";

interface PathWidthState {
    pathWidth: number;
    setPathWidth: (width: number) => void;
}

export const usePathWidthStore = create<PathWidthState>((set) => ({
    pathWidth: 20,
    setPathWidth: (width: number) =>
        set(() => ({
            pathWidth: width,
        })),
}));
