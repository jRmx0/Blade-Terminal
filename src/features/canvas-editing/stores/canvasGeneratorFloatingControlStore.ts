import { create } from "zustand";

interface CanvasGeneratorFloatingControlState {
    isOpen: boolean;
    width: string;
    height: string;
    cellSize: string;
    obstacleRatio: string;
    clustering: string;
    seed: string;
    autoObstacleRatioHint: number | null;
    autoClusteringHint: number | null;
    lastSeedHex: string | null;
    controlPosition: { x: number; y: number };
    hasObsLeftField: boolean;
    hasClustLeftField: boolean;
    lastPickedObsValue: number | null;
    lastPickedClustValue: number | null;
    setOpen: (open: boolean) => void;
    setWidth: (width: string) => void;
    setHeight: (height: string) => void;
    setCellSize: (cellSize: string) => void;
    setObstacleRatio: (obstacleRatio: string) => void;
    setClustering: (clustering: string) => void;
    setSeed: (seed: string) => void;
    setAutoObstacleRatioHint: (autoObstacleRatioHint: number | null) => void;
    setAutoClusteringHint: (autoClusteringHint: number | null) => void;
    setLastSeedHex: (lastSeedHex: string | null) => void;
    setControlPosition: (controlPosition: { x: number; y: number }) => void;
    setHasObsLeftField: (hasObsLeftField: boolean) => void;
    setHasClustLeftField: (hasClustLeftField: boolean) => void;
    setLastPickedObsValue: (lastPickedObsValue: number | null) => void;
    setLastPickedClustValue: (lastPickedClustValue: number | null) => void;
}

export const useCanvasGeneratorFloatingControlStore = create<CanvasGeneratorFloatingControlState>((set) => ({
    isOpen: false,
    width: "1000",
    height: "1000",
    cellSize: "30",
    obstacleRatio: "",
    clustering: "",
    seed: "",
    autoObstacleRatioHint: null,
    autoClusteringHint: null,
    lastSeedHex: null,
    controlPosition: { x: 16, y: 16 },
    hasObsLeftField: false,
    hasClustLeftField: false,
    lastPickedObsValue: null,
    lastPickedClustValue: null,
    setOpen: (open) => set({ isOpen: open }),
    setWidth: (width) => set({ width }),
    setHeight: (height) => set({ height }),
    setCellSize: (cellSize) => set({ cellSize }),
    setObstacleRatio: (obstacleRatio) => set({ obstacleRatio }),
    setClustering: (clustering) => set({ clustering }),
    setSeed: (seed) => set({ seed }),
    setAutoObstacleRatioHint: (autoObstacleRatioHint) => set({ autoObstacleRatioHint }),
    setAutoClusteringHint: (autoClusteringHint) => set({ autoClusteringHint }),
    setLastSeedHex: (lastSeedHex) => set({ lastSeedHex }),
    setControlPosition: (controlPosition) => set({ controlPosition }),
    setHasObsLeftField: (hasObsLeftField) => set({ hasObsLeftField }),
    setHasClustLeftField: (hasClustLeftField) => set({ hasClustLeftField }),
    setLastPickedObsValue: (lastPickedObsValue) => set({ lastPickedObsValue }),
    setLastPickedClustValue: (lastPickedClustValue) => set({ lastPickedClustValue }),
}));
