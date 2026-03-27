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
        db.table("computationAlgorithms"),
        db.table("computationAlgorithmParametersSetup"),
    ], async () => {
        await db.table("computationAlgorithmParametersSetup").where("computationProviderId").equals(id).delete();
        await db.table("computationAlgorithms").where("computationProviderId").equals(id).delete();
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
