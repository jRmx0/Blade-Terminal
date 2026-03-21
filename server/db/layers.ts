import { db } from "./db";
import type { LayerRecord } from "@/types/layerTypes";

export async function getAllLayers(): Promise<LayerRecord[]> {
    return db.table<LayerRecord>("layers").toArray();
}

export async function getLayerByKey(key: number): Promise<LayerRecord | undefined> {
    return db.table<LayerRecord>("layers").where("key").equals(key).first();
}
