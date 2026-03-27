import { db } from "./db";
import type { LayerRecord } from "@/types/layerTypes";

export async function getAllLayers(): Promise<LayerRecord[]> {
    return db.table<LayerRecord>("layersSetup").toArray();
}

export async function getLayerByKey(key: number): Promise<LayerRecord | undefined> {
    return db.table<LayerRecord>("layersSetup").where("key").equals(key).first();
}

export async function replaceLayersForAlgorithm(
    providerId: number,
    algorithmId: number,
    layers: LayerRecord[],
): Promise<void> {
    await db.transaction("rw", db.table("layersSetup"), async () => {
        await db
            .table<LayerRecord>("layersSetup")
            .where("[algorithmId+providerId]")
            .equals([algorithmId, providerId])
            .delete();
        if (layers.length > 0) {
            await db.table<LayerRecord>("layersSetup").bulkPut(layers);
        }
    });
}
