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
    await db.transaction("rw", [
        db.table("layersSetup"),
        db.table("layerSettingsSetup"),
        db.table("layerSettings"),
    ], async () => {
        await db
            .table<LayerRecord>("layersSetup")
            .where("[algorithmId+providerId]")
            .equals([algorithmId, providerId])
            .delete();
        if (layers.length > 0) {
            await db.table<LayerRecord>("layersSetup").bulkPut(layers);
        }

        const validLayerKeys = new Set(layers.map((layer) => layer.key));
        await db.table("layerSettingsSetup")
            .filter(
                (row) => row.algorithmId === algorithmId
                    && row.providerId === providerId
                    && !validLayerKeys.has(row.layerId),
            )
            .delete();
        await db.table("layerSettings")
            .filter(
                (row) => row.algorithmId === algorithmId
                    && row.providerId === providerId
                    && !validLayerKeys.has(row.layerId),
            )
            .delete();
    });
}
