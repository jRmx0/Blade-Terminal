import { create } from "zustand";
import { getLayerSettingsByEnvironment, saveAllLayerSettings } from "@server/db/layerSettings";
import { getAllLayers } from "@server/db/layersSetup";
import { getSaveMode } from "@/stores/saveModeStore";
import type { LayerPK, LayerRecord, LayerSettingParameter, LayerWithSettings } from "@/types/layerTypes";
import { LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";

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
            if (!item || paramValue(item.settings, LAYER_PARAM_KEY.VISIBLE) === String(visible)) return {};
            const layers = updateParam(state.layers, pk, LAYER_PARAM_KEY.VISIBLE, String(visible));
            autosave(layers);
            return { layers, isLayerSettingsDirty: true };
        });
    },

    setParam: (layerKey, name, value) => {
        set((state) => {
            const item = state.layers.find((l) => l.layer.id === layerKey);
            if (!item || paramValue(item.settings, name) === value) return {};
            const layers = state.layers.map((l) => {
                if (l.layer.id !== layerKey) return l;
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
            const zA = paramValue(a.settings, LAYER_PARAM_KEY.Z_INDEX) ?? "0";
            const zB = paramValue(b.settings, LAYER_PARAM_KEY.Z_INDEX) ?? "0";
            let layers = updateParam(state.layers, pkA, LAYER_PARAM_KEY.Z_INDEX, zB);
            layers = updateParam(layers, pkB, LAYER_PARAM_KEY.Z_INDEX, zA);
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
    const [allParams, allLayers] = await Promise.all([
        getLayerSettingsByEnvironment(environmentId),
        getAllLayers(),
    ]);
    const layerInfoMap = new Map<string, LayerRecord>();
    for (const l of allLayers) {
        layerInfoMap.set(`${l.id}:${l.algorithmId}:${l.providerId}`, l);
    }
    const paramsByKey = new Map<string, LayerSettingParameter[]>();
    for (const param of allParams) {
        const key = `${param.layerId}:${param.algorithmId}:${param.providerId}`;
        const list = paramsByKey.get(key) ?? [];
        list.push(param);
        paramsByKey.set(key, list);
    }
    const layerKeySet = new Map<string, LayerRecord>();
    for (const param of allParams) {
        const compositeKey = `${param.layerId}:${param.algorithmId}:${param.providerId}`;
        if (!layerKeySet.has(compositeKey)) {
            const info = layerInfoMap.get(compositeKey);
            layerKeySet.set(compositeKey, info ?? {
                id: param.layerId,
                algorithmId: param.algorithmId,
                providerId: param.providerId,
                label: "",
            });
        }
    }
    const layers: LayerWithSettings[] = Array.from(layerKeySet.entries()).map(([key, layer]) => {
        return { layer, settings: paramsByKey.get(key) ?? [] };
    });
    useLayerSettingsStore.getState().setLayers(layers);
}

export function getLayerParam(layers: LayerWithSettings[], layerKey: number, key: string): string | undefined {
    return layers.find((l) => l.layer.id === layerKey)?.settings.find((p) => p.key === key)?.value;
}
