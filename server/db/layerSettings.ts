import { db } from "./db";
import type { LayerSettingParameter } from "@/types/layerTypes";

export async function getAllLayerSettings(): Promise<LayerSettingParameter[]> {
    return db.table<LayerSettingParameter>("layerSettings").toArray();
}

export async function getLayerSettingsByLayerId(layerId: number): Promise<LayerSettingParameter[]> {
    return db.table<LayerSettingParameter>("layerSettings").where("layerId").equals(layerId).toArray();
}

export async function upsertLayerSetting(param: LayerSettingParameter): Promise<void> {
    await db.table<LayerSettingParameter>("layerSettings").put(param);
}

export async function saveAllLayerSettings(params: LayerSettingParameter[]): Promise<void> {
    await db.table<LayerSettingParameter>("layerSettings").bulkPut(params);
}
