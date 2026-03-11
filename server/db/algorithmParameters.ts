import { db } from "./db";
import type { AlgorithmParameter } from "@/types/serviceTypes";

export async function getParametersByAlgorithm(
    algorithmId: number,
    computationProviderId: number,
): Promise<AlgorithmParameter[]> {
    return db
        .table("computationAlgorithmParameters")
        .where("[algorithmId+computationProviderId]")
        .equals([algorithmId, computationProviderId])
        .toArray();
}

export async function bulkPutParameters(parameters: AlgorithmParameter[]): Promise<void> {
    await db.table("computationAlgorithmParameters").bulkPut(parameters);
}
