import { db } from "./db";
import type { LayerSettingParameter, LayerSettingsSetup } from "@/types/layerTypes";

export async function getLayerSettingsByEnvironment(environmentId: number): Promise<LayerSettingParameter[]> {
    return db
        .table<LayerSettingParameter>("layerSettings")
        .where("environmentId")
        .equals(environmentId)
        .toArray();
}

export async function initLayerSettingsForEnvironment(environmentId: number): Promise<void> {
    const setups = await db.table<LayerSettingsSetup>("layerSettingsSetup").toArray();
    const settings: LayerSettingParameter[] = setups.map((s) => ({
        id: s.id,
        layerId: s.layerId,
        algorithmId: s.algorithmId,
        providerId: s.providerId,
        environmentId,
        key: s.key,
        value: s.defaultValue ?? "",
    }));
    if (settings.length > 0) {
        await db.table<LayerSettingParameter>("layerSettings").bulkPut(settings);
    }
}

export async function deleteLayerSettingsForEnvironment(environmentId: number): Promise<void> {
    await db
        .table<LayerSettingParameter>("layerSettings")
        .where("environmentId")
        .equals(environmentId)
        .delete();
}

export async function saveAllLayerSettings(params: LayerSettingParameter[]): Promise<void> {
    await db.table<LayerSettingParameter>("layerSettings").bulkPut(params);
}

