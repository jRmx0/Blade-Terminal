import { db } from "./db";
import type { LayerSettingParameter, LayerSettingsSetup } from "@/types/layerTypes";

/**
 * Builds the initial string value for a `layerSettings` row from its setup record.
 * For `PointLabelEnum` rows the provider colour mapping is encoded as JSON so that
 * the inspector panel can display the correct per-value colours immediately.
 * All other rows fall back to the plain `defaultValue` string.
 */
function buildInitialValue(setup: LayerSettingsSetup): string {
    if (setup.styleType === "PointLabelEnum" && Array.isArray(setup.enumValues) && setup.enumValues.length > 0) {
        const entries = setup.enumValues.map((v) => ({
            value: v,
            color: setup.mapping?.find((m) => m.value === v)?.color ?? null,
        }));
        return JSON.stringify(entries);
    }
    return setup.defaultValue ?? "";
}

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
        value: buildInitialValue(s),
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

/**
 * Seeds per-environment `layerSettings` rows from `setups` for any setup that does
 * not yet have a row for this environment. Existing user-set values are preserved.
 */
export async function addMissingLayerSettingsForEnvironment(
    environmentId: number,
    setups: LayerSettingsSetup[],
): Promise<void> {
    if (setups.length === 0) return;
    const compoundKeys = setups.map((s) => [s.id, s.layerId, s.algorithmId, s.providerId, environmentId]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await db.table<LayerSettingParameter>("layerSettings").bulkGet(compoundKeys as any[]);
    const newRows: LayerSettingParameter[] = [];
    for (let i = 0; i < setups.length; i++) {
        if (existing[i] == null) {
            const s = setups[i]!;
            newRows.push({
                id: s.id,
                layerId: s.layerId,
                algorithmId: s.algorithmId,
                providerId: s.providerId,
                environmentId,
                key: s.key,
                value: buildInitialValue(s),
            });
        }
    }
    if (newRows.length > 0) {
        await db.table<LayerSettingParameter>("layerSettings").bulkPut(newRows);
    }
}

