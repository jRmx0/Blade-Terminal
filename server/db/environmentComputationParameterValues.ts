import { db } from "./db";
import type { EnvironmentComputationParameterValue } from "@/types/schemaTypes";

const table = db.table<EnvironmentComputationParameterValue, [number, number, number, number]>(
    "environmentComputationParameterValues",
);

export async function getParameterValues(
    algorithmId: number,
    providerId: number,
    environmentId: number,
): Promise<EnvironmentComputationParameterValue[]> {
    return table
        .where("[algorithmId+providerId+environmentId]")
        .equals([algorithmId, providerId, environmentId])
        .toArray();
}

export async function setParameterValue(
    id: number,
    algorithmId: number,
    providerId: number,
    environmentId: number,
    value: string,
): Promise<void> {
    await table.put({ id, environmentId, providerId, algorithmId, value });
}

export async function getAllParameterValuesByEnvironment(environmentId: number): Promise<EnvironmentComputationParameterValue[]> {
    return table.where("environmentId").equals(environmentId).toArray();
}

export async function saveParameterValues(values: EnvironmentComputationParameterValue[]): Promise<void> {
    await table.bulkPut(values);
}

export async function deleteParameterValuesByEnvironment(environmentId: number): Promise<void> {
    await table.where("environmentId").equals(environmentId).delete();
}
