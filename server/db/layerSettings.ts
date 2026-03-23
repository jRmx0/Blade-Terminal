import { db } from "./db";
import type { LayerPK, LayerSettingParameter } from "@/types/layerTypes";

export async function getAllLayerSettings(): Promise<LayerSettingParameter[]> {
    return db.table<LayerSettingParameter>("layerSettings").toArray();
}

export async function getLayerSettingsByLayerPK(pk: LayerPK): Promise<LayerSettingParameter[]> {
    return db
        .table<LayerSettingParameter>("layerSettings")
        .where("[layerId+algorithmId+providerId]")
        .equals([pk.id, pk.algorithmId, pk.providerId])
        .toArray();
}

export async function upsertLayerSetting(param: LayerSettingParameter): Promise<void> {
    await db.table<LayerSettingParameter>("layerSettings").put(param);
}

export async function saveAllLayerSettings(params: LayerSettingParameter[]): Promise<void> {
    await db.table<LayerSettingParameter>("layerSettings").bulkPut(params);
}
