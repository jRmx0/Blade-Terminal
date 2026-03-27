import { db } from "./db";
import type { LayerRecord } from "@/types/layerTypes";

export async function getAllLayers(): Promise<LayerRecord[]> {
    return db.table<LayerRecord>("layers").toArray();
}

export async function getLayerByKey(key: number): Promise<LayerRecord | undefined> {
    return db.table<LayerRecord>("layers").where("key").equals(key).first();
}

export async function replaceLayersForAlgorithm(
    providerId: number,
    algorithmId: number,
    layers: LayerRecord[],
): Promise<void> {
    await db.transaction("rw", db.table("layers"), async () => {
        await db
            .table<LayerRecord>("layers")
            .where("[algorithmId+providerId]")
            .equals([algorithmId, providerId])
            .delete();
        if (layers.length > 0) {
            await db.table<LayerRecord>("layers").bulkPut(layers);
        }
    });
}
