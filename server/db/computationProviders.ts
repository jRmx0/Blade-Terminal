import type { Table } from "dexie";
import { db } from "./db";
import type { ComputationProvider } from "@/types/serviceTypes";

const table: Table<ComputationProvider, number> = db.table("computationProviders");

export async function getAllComputationProviders(): Promise<ComputationProvider[]> {
    return table.toArray();
}

export async function getComputationProvider(id: number): Promise<ComputationProvider | undefined> {
    return table.get(id);
}

export async function saveComputationProvider(provider: ComputationProvider): Promise<number> {
    return table.put(provider) as Promise<number>;
}

export async function deleteComputationProvider(id: number): Promise<void> {
    await db.transaction("rw", [
        db.table("computationProviders"),
        db.table("computationProviderAlgorithms"),
        db.table("computationAlgorithmParametersSetup"),
        db.table("algorithmMetricsSetup"),
        db.table("layersSetup"),
        db.table("layerSettingsSetup"),
        db.table("layerSettings"),
    ], async () => {
        await db.table("computationAlgorithmParametersSetup").where("computationProviderId").equals(id).delete();
        await db.table("algorithmMetricsSetup").where("computationProviderId").equals(id).delete();
        await db.table("computationProviderAlgorithms").where("computationProviderId").equals(id).delete();
        await db.table("layersSetup").where("providerId").equals(id).delete();
        await db.table("layerSettingsSetup").filter((row) => row.providerId === id).delete();
        await db.table("layerSettings").filter((row) => row.providerId === id).delete();
        await table.delete(id);
    });
}

export async function updateMetadataTimestamp(
    id: number,
    urlAtLastFetch: string,
    metadataFetchedAt: number,
): Promise<void> {
    await table.update(id, { urlAtLastFetch, metadataFetchedAt });
}
