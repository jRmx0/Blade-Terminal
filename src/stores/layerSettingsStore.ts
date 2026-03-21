import { create } from "zustand";
import { db } from "@server/db/db";
import { saveAllLayerSettings } from "@server/db/layerSettings";
import { getSaveMode } from "@/stores/saveModeStore";
import type { LayerRecord, LayerSettingParameter, LayerWithSettings } from "@/types/layerTypes";

interface LayerSettingsState {
    layers: LayerWithSettings[];
    /** True when layer settings have been changed since the last save or load. */
    isLayerSettingsDirty: boolean;
    /** Replaces all layer data. Used by workspace bridge after load or init. Does not mark dirty. */
    setLayers: (layers: LayerWithSettings[]) => void;
    setVisible: (layerId: number, visible: boolean) => void;
    setParam: (layerKey: number, name: string, value: string) => void;
    swapZIndex: (layerIdA: number, layerIdB: number) => void;
    /** Clears the dirty flag. Called by canvas bridge after a successful save. */
    clearDirty: () => void;
}

function getAllParams(layers: LayerWithSettings[]): LayerSettingParameter[] {
    return layers.flatMap((l) => l.settings);
}

function autosave(layers: LayerWithSettings[]): void {
    if (getSaveMode() === "autosave") {
        saveAllLayerSettings(getAllParams(layers)).catch(console.error);
    }
}

function updateParam(
    layers: LayerWithSettings[],
    layerId: number,
    name: string,
    value: string,
): LayerWithSettings[] {
    return layers.map((l) => {
        if (l.layer.id !== layerId) return l;
        return { ...l, settings: l.settings.map((p) => (p.name === name ? { ...p, value } : p)) };
    });
}

function paramValue(settings: LayerSettingParameter[], name: string): string | undefined {
    return settings.find((p) => p.name === name)?.value;
}

export const useLayerSettingsStore = create<LayerSettingsState>()((set) => ({
    layers: [],
    isLayerSettingsDirty: false,

    setLayers: (layers) => set({ layers, isLayerSettingsDirty: false }),

    setVisible: (layerId, visible) => {
        set((state) => {
            const item = state.layers.find((l) => l.layer.id === layerId);
            if (!item || paramValue(item.settings, "Visible") === String(visible)) return {};
            const layers = updateParam(state.layers, layerId, "Visible", String(visible));
            autosave(layers);
            return { layers, isLayerSettingsDirty: true };
        });
    },

    setParam: (layerKey, name, value) => {
        set((state) => {
            const item = state.layers.find((l) => l.layer.key === layerKey);
            if (!item || paramValue(item.settings, name) === value) return {};
            const layers = state.layers.map((l) => {
                if (l.layer.key !== layerKey) return l;
                return { ...l, settings: l.settings.map((p) => (p.name === name ? { ...p, value } : p)) };
            });
            autosave(layers);
            return { layers, isLayerSettingsDirty: true };
        });
    },

    swapZIndex: (layerIdA, layerIdB) => {
        set((state) => {
            const a = state.layers.find((l) => l.layer.id === layerIdA);
            const b = state.layers.find((l) => l.layer.id === layerIdB);
            if (!a || !b) return {};
            const zA = paramValue(a.settings, "Z-Index") ?? "0";
            const zB = paramValue(b.settings, "Z-Index") ?? "0";
            let layers = updateParam(state.layers, layerIdA, "Z-Index", zB);
            layers = updateParam(layers, layerIdB, "Z-Index", zA);
            autosave(layers);
            return { layers, isLayerSettingsDirty: true };
        });
    },

    clearDirty: () => set({ isLayerSettingsDirty: false }),
}));

export async function loadLayerSettings(): Promise<void> {
    const layerRecords = await db.table<LayerRecord>("layers").toArray();
    const allParams = await db.table<LayerSettingParameter>("layerSettings").toArray();
    const paramsByLayerId = new Map<number, LayerSettingParameter[]>();
    for (const param of allParams) {
        const list = paramsByLayerId.get(param.layerId) ?? [];
        list.push(param);
        paramsByLayerId.set(param.layerId, list);
    }
    const layers: LayerWithSettings[] = layerRecords
        .map((layer) => ({ layer, settings: paramsByLayerId.get(layer.id!) ?? [] }))
        .filter((item) => item.settings.length > 0);
    useLayerSettingsStore.getState().setLayers(layers);
}

export function getLayerParam(layers: LayerWithSettings[], layerKey: number, name: string): string | undefined {
    return layers.find((l) => l.layer.key === layerKey)?.settings.find((p) => p.name === name)?.value;
}
