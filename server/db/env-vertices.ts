import type { Table } from "dexie";
import { db } from "./db";
import type { EnvVertex } from "@/types/envTypes";

export const envVerticesTable: Table<EnvVertex, number> = db.table("env_vertices");

export async function getEnvVertex(id: number): Promise<EnvVertex | undefined> {
    return envVerticesTable.get(id);
}

export async function getEnvVerticesByObject(objectId: number): Promise<EnvVertex[]> {
    return envVerticesTable.where("objectId").equals(objectId).toArray();
}

export async function saveEnvVertex(vertex: EnvVertex): Promise<void> {
    await envVerticesTable.put(vertex);
}

export async function saveEnvVertices(vertices: EnvVertex[]): Promise<void> {
    await envVerticesTable.bulkPut(vertices);
}

export async function updateEnvVertex(id: number, changes: Partial<EnvVertex>): Promise<void> {
    await envVerticesTable.update(id, changes);
}

export async function deleteEnvVertex(id: number): Promise<void> {
    await envVerticesTable.delete(id);
}

export async function deleteEnvVerticesByObject(objectId: number): Promise<void> {
    await envVerticesTable.where("objectId").equals(objectId).delete();
}
