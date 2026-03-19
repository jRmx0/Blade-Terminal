import { db } from "./db";
import type { ComputationAlgorithm } from "@/types/serviceTypes";

export async function getAlgorithmsByProvider(computationProviderId: number): Promise<ComputationAlgorithm[]> {
    return db.table("computationAlgorithms").where("computationProviderId").equals(computationProviderId).toArray();
}

export async function getAllComputationAlgorithms(): Promise<ComputationAlgorithm[]> {
    return db.table("computationAlgorithms").toArray();
}

export async function replaceAlgorithmsForProvider(
    computationProviderId: number,
    algorithms: Omit<ComputationAlgorithm, "id">[],
): Promise<ComputationAlgorithm[]> {
    return db.transaction("rw", [
        db.table("computationAlgorithms"),
        db.table("computationAlgorithmParameters"),
    ], async () => {
        await db.table("computationAlgorithmParameters").where("computationProviderId").equals(computationProviderId).delete();
        await db.table("computationAlgorithms").where("computationProviderId").equals(computationProviderId).delete();

        const saved: ComputationAlgorithm[] = [];
        for (let i = 0; i < algorithms.length; i++) {
            const record: ComputationAlgorithm = { ...algorithms[i]!, id: i + 1, computationProviderId };
            await db.table("computationAlgorithms").put(record);
            saved.push(record);
        }
        return saved;
    });
}
