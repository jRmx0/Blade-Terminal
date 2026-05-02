import type { Table } from "dexie";
import { db } from "./db";
import type { CoverageGridVisitCacheRecord } from "@/types/schemaTypes";

const table: Table<CoverageGridVisitCacheRecord, [number, string, number]> = db.table("coverageGridVisitCache");

export async function getCoverageGridVisitCache(
    environmentId: number,
    resultSignature: string,
    cellSize: number,
): Promise<CoverageGridVisitCacheRecord | undefined> {
    return table.get([environmentId, resultSignature, cellSize]);
}

export async function saveCoverageGridVisitCache(record: CoverageGridVisitCacheRecord): Promise<void> {
    await table.put(record);
}

export async function deleteCoverageGridVisitCacheByEnvironment(environmentId: number): Promise<void> {
    await table.where("environmentId").equals(environmentId).delete();
}

export async function deleteCoverageGridVisitCacheByResult(
    environmentId: number,
    resultSignature: string,
): Promise<void> {
    await table.where("[environmentId+resultSignature]").equals([environmentId, resultSignature]).delete();
}
