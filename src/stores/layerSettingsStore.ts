import { create } from "zustand";
import { getLayerSettingsByEnvironment, saveAllLayerSettings } from "@server/db/layerSettings";
import { getSaveMode } from "@/stores/saveModeStore";
import type { LayerPK, LayerRecord, LayerSettingParameter, LayerWithSettings } from "@/types/layerTypes";

interface LayerSettingsState {
    layers: LayerWithSettings[];
    /** True when layer settings have been changed since the last save or load. */
    isLayerSettingsDirty: boolean;
    /** Replaces all layer data. Used by workspace bridge after load or init. Does not mark dirty. */
    setLayers: (layers: LayerWithSettings[]) => void;
    setVisible: (pk: LayerPK, visible: boolean) => void;
    setParam: (layerKey: number, name: string, value: string) => void;
    swapZIndex: (pkA: LayerPK, pkB: LayerPK) => void;
    /**
     * Reassigns Z-Index values based on display order. `orderedPKs` lists
     * layer PKs from top (highest z) to bottom (lowest z). Each layer gets
     * z = (n - 1 - position) * 10.
     */
    reorderLayers: (orderedPKs: LayerPK[]) => void;
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

function layerPKMatches(layer: LayerRecord, pk: LayerPK): boolean {
    return layer.id === pk.id && layer.algorithmId === pk.algorithmId && layer.providerId === pk.providerId;
}

function updateParam(
    layers: LayerWithSettings[],
    pk: LayerPK,
    key: string,
    value: string,
): LayerWithSettings[] {
    return layers.map((l) => {
        if (!layerPKMatches(l.layer, pk)) return l;
        return { ...l, settings: l.settings.map((p) => (p.key === key ? { ...p, value } : p)) };
    });
}

function paramValue(settings: LayerSettingParameter[], key: string): string | undefined {
    return settings.find((p) => p.key === key)?.value;
}

export const useLayerSettingsStore = create<LayerSettingsState>()((set) => ({
    layers: [],
    isLayerSettingsDirty: false,

    setLayers: (layers) => set({ layers, isLayerSettingsDirty: false }),

    setVisible: (pk, visible) => {
        set((state) => {
            const item = state.layers.find((l) => layerPKMatches(l.layer, pk));
            if (!item || paramValue(item.settings, "Visible") === String(visible)) return {};
            const layers = updateParam(state.layers, pk, "Visible", String(visible));
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
                return { ...l, settings: l.settings.map((p) => (p.key === name ? { ...p, value } : p)) };
            });
            autosave(layers);
            return { layers, isLayerSettingsDirty: true };
        });
    },

    swapZIndex: (pkA, pkB) => {
        set((state) => {
            const a = state.layers.find((l) => layerPKMatches(l.layer, pkA));
            const b = state.layers.find((l) => layerPKMatches(l.layer, pkB));
            if (!a || !b) return {};
            const zA = paramValue(a.settings, "Z-Index") ?? "0";
            const zB = paramValue(b.settings, "Z-Index") ?? "0";
            let layers = updateParam(state.layers, pkA, "Z-Index", zB);
            layers = updateParam(layers, pkB, "Z-Index", zA);
            autosave(layers);
            return { layers, isLayerSettingsDirty: true };
        });
    },

    reorderLayers: (orderedPKs) => {
        set((state) => {
            const n = orderedPKs.length;
            let layers = state.layers;
            orderedPKs.forEach((pk, idx) => {
                layers = updateParam(layers, pk, "Z-Index", String((n - 1 - idx) * 10));
            });
            autosave(layers);
            return { layers, isLayerSettingsDirty: true };
        });
    },

    clearDirty: () => set({ isLayerSettingsDirty: false }),
}));

export async function loadLayerSettings(environmentId: number): Promise<void> {
    const allParams = await getLayerSettingsByEnvironment(environmentId);
    const paramsByKey = new Map<string, LayerSettingParameter[]>();
    for (const param of allParams) {
        const key = `${param.layerId}:${param.algorithmId}:${param.providerId}`;
        const list = paramsByKey.get(key) ?? [];
        list.push(param);
        paramsByKey.set(key, list);
    }
    // Build LayerRecord stubs from the settings so we don't need a separate layers table read.
    // The full LayerRecord detail (label, type, placeholder) isn't needed here — only the PK fields
    // and key are required to drive the canvas. Those are embedded in every LayerSettingParameter.
    const layerKeySet = new Map<string, LayerRecord>();
    for (const param of allParams) {
        const compositeKey = `${param.layerId}:${param.algorithmId}:${param.providerId}`;
        if (!layerKeySet.has(compositeKey)) {
            layerKeySet.set(compositeKey, {
                id: param.layerId,
                algorithmId: param.algorithmId,
                providerId: param.providerId,
                key: param.layerId,
                label: "",
            });
        }
    }
    const layers: LayerWithSettings[] = Array.from(layerKeySet.values()).map((layer) => {
        const key = `${layer.id}:${layer.algorithmId}:${layer.providerId}`;
        return { layer, settings: paramsByKey.get(key) ?? [] };
    });
    useLayerSettingsStore.getState().setLayers(layers);
}

export function getLayerParam(layers: LayerWithSettings[], layerKey: number, key: string): string | undefined {
    return layers.find((l) => l.layer.key === layerKey)?.settings.find((p) => p.key === key)?.value;
}
