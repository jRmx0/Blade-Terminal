import { create } from "zustand";
import { ENV_FORMAT, OBJECT_TYPE } from "@/config/enums";
import type { Environment } from "@/types/envTypes";

interface EnvState {
    env: Environment;
    setName: (name: string) => void;
    incrementZoneCount: () => void;
    decrementZoneCount: () => void;
    incrementObstacleCount: () => void;
    decrementObstacleCount: () => void;
}

const INITIAL_ENV: Environment = {
    id: "env-1",
    name: "Default Environment",
    format: ENV_FORMAT.POLYGON,
    type: OBJECT_TYPE.OFFLINE,
    zoneObjectCount: 0,
    obstacleObjectCount: 0,
};

export const useEnvStore = create<EnvState>((set) => ({
    env: INITIAL_ENV,

    setName: (name) =>
        set((state) => ({ env: { ...state.env, name } })),

    incrementZoneCount: () =>
        set((state) => ({
            env: { ...state.env, zoneObjectCount: state.env.zoneObjectCount + 1 },
        })),

    decrementZoneCount: () =>
        set((state) => ({
            env: { ...state.env, zoneObjectCount: Math.max(0, state.env.zoneObjectCount - 1) },
        })),

    incrementObstacleCount: () =>
        set((state) => ({
            env: { ...state.env, obstacleObjectCount: state.env.obstacleObjectCount + 1 },
        })),

    decrementObstacleCount: () =>
        set((state) => ({
            env: { ...state.env, obstacleObjectCount: Math.max(0, state.env.obstacleObjectCount - 1) },
        })),
}));
