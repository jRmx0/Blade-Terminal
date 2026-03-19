import type { Table } from "dexie";
import { db } from "./db";
import type { EnvironmentComputation } from "@/types/schemaTypes";

const environmentComputationTable: Table<EnvironmentComputation, number> = db.table("environmentComputation");

function emptyRecord(environmentId: number): EnvironmentComputation {
    return { environmentId, selectedProviderId: null, selectedAlgorithmId: null };
}

export async function getEnvironmentComputation(environmentId: number): Promise<EnvironmentComputation> {
    return (await environmentComputationTable.get(environmentId)) ?? emptyRecord(environmentId);
}

export async function saveEnvironmentComputation(computation: EnvironmentComputation): Promise<void> {
    await environmentComputationTable.put(computation);
}

export async function deleteEnvironmentComputation(environmentId: number): Promise<void> {
    await environmentComputationTable.delete(environmentId);
}
