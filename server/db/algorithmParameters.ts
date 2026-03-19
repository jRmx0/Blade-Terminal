import { db } from "./db";
import type { AlgorithmParameter } from "@/types/serviceTypes";

const table = db.table<AlgorithmParameter, [number, number, number]>("computationAlgorithmParameters");

export async function getParametersByAlgorithm(
    algorithmId: number,
    computationProviderId: number,
): Promise<AlgorithmParameter[]> {
    return table
        .where("[algorithmId+computationProviderId]")
        .equals([algorithmId, computationProviderId])
        .toArray();
}

export async function getAllAlgorithmParameters(): Promise<AlgorithmParameter[]> {
    return table.toArray();
}

export async function bulkPutParameters(parameters: AlgorithmParameter[]): Promise<void> {
    await table.bulkPut(parameters);
}
