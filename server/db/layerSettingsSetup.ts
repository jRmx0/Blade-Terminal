import { db } from "./db";
import type { LayerSettingsSetup } from "@/types/layerTypes";

export async function getAllLayerSettingsSetup(): Promise<LayerSettingsSetup[]> {
    return db.table<LayerSettingsSetup>("layerSettingsSetup").toArray();
}

export async function replaceLayerSettingsSetupForAlgorithm(
    providerId: number,
    algorithmId: number,
    setups: LayerSettingsSetup[],
): Promise<void> {
    await db.transaction("rw", db.table("layerSettingsSetup"), async () => {
        await db
            .table<LayerSettingsSetup>("layerSettingsSetup")
            .where("[algorithmId+providerId]")
            .equals([algorithmId, providerId])
            .delete();
        if (setups.length > 0) {
            await db.table<LayerSettingsSetup>("layerSettingsSetup").bulkPut(setups);
        }
    });
}
