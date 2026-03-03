import type { Table } from "dexie";
import { db } from "./db";
import type { EnvVertex } from "@/types/envTypes";

export const envVerticesTable: Table<EnvVertex, [number, number]> = db.table("env_vertices");

export async function getEnvVertex(id: number, objectId: number): Promise<EnvVertex | undefined> {
    return envVerticesTable.get([id, objectId]);
}

export async function getEnvVerticesByObject(objectId: number): Promise<EnvVertex[]> {
    return envVerticesTable.where("objectId").equals(objectId).toArray();
}

export async function getEnvVerticesByObjectIds(objectIds: number[]): Promise<EnvVertex[]> {
    return envVerticesTable.where("objectId").anyOf(objectIds).toArray();
}

export async function saveEnvVertex(vertex: EnvVertex): Promise<void> {
    await envVerticesTable.put(vertex);
}

export async function saveEnvVertices(vertices: EnvVertex[]): Promise<void> {
    await envVerticesTable.bulkPut(vertices);
}

export async function updateEnvVertex(id: number, objectId: number, changes: Partial<EnvVertex>): Promise<void> {
    await envVerticesTable.update([id, objectId], changes);
}

export async function deleteEnvVertex(id: number, objectId: number): Promise<void> {
    await envVerticesTable.delete([id, objectId]);
}

export async function deleteEnvVerticesByObject(objectId: number): Promise<void> {
    await envVerticesTable.where("objectId").equals(objectId).delete();
}

export async function deleteEnvVerticesByObjectIds(objectIds: number[]): Promise<void> {
    await envVerticesTable.where("objectId").anyOf(objectIds).delete();
}

/** Returns the highest vertex id in the table, or 0 when empty. Used to seed the in-memory id counter. */
export async function getMaxEnvVertexId(): Promise<number> {
    const last = await envVerticesTable.orderBy("[id+objectId]").last();
    return last?.id ?? 0;
}
