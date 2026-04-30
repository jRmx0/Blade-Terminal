import { create } from "zustand";
import { getEnvPoints, upsertEnvPoint, deleteEnvPoint } from "@server/db/envPoints";
import type { EnvPoint, EnvPointType } from "@/types/schemaTypes";

interface EnvPointState {
    startPoint: EnvPoint | null;
    endPoint: EnvPoint | null;
    isEnvPointsDirty: boolean;
    loadEnvPoints: (environmentId: number) => Promise<void>;
    upsertPoint: (environmentId: number, type: EnvPointType, point: { x: number; y: number }) => Promise<void>;
    deletePoint: (environmentId: number, type: EnvPointType) => Promise<void>;
    changePointType: (environmentId: number, fromType: EnvPointType, toType: EnvPointType) => Promise<void>;
    clearDirty: () => void;
    clearPoints: () => void;
}

export const useEnvPointStore = create<EnvPointState>((set) => ({
    startPoint: null,
    endPoint: null,
    isEnvPointsDirty: false,

    loadEnvPoints: async (environmentId: number) => {
        const points = await getEnvPoints(environmentId);
        set({
            startPoint: points.find((p) => p.type === "start") ?? null,
            endPoint: points.find((p) => p.type === "end") ?? null,
        });
    },

    upsertPoint: async (environmentId: number, type: EnvPointType, point: { x: number; y: number }) => {
        await upsertEnvPoint(environmentId, type, point);
        const updated: EnvPoint = { environmentId, type, point };
        if (type === "start") {
            set({ startPoint: updated, isEnvPointsDirty: true });
        } else {
            set({ endPoint: updated, isEnvPointsDirty: true });
        }
    },

    deletePoint: async (environmentId: number, type: EnvPointType) => {
        await deleteEnvPoint(environmentId, type);
        if (type === "start") {
            set({ startPoint: null, isEnvPointsDirty: true });
        } else {
            set({ endPoint: null, isEnvPointsDirty: true });
        }
    },

    changePointType: async (environmentId: number, fromType: EnvPointType, toType: EnvPointType) => {
        const state = useEnvPointStore.getState();
        const coords = fromType === "start" ? state.startPoint?.point : state.endPoint?.point;
        if (!coords) return;
        await deleteEnvPoint(environmentId, fromType);
        await deleteEnvPoint(environmentId, toType);
        await upsertEnvPoint(environmentId, toType, coords);
        const updated: EnvPoint = { environmentId, type: toType, point: coords };
        set({
            startPoint: toType === "start" ? updated : null,
            endPoint: toType === "end" ? updated : null,
            isEnvPointsDirty: true,
        });
    },

    clearDirty: () => set({ isEnvPointsDirty: false }),

    clearPoints: () => {
        set({ startPoint: null, endPoint: null });
    },
}));
