import type { Table } from "dexie";
import { db } from "./db";
import type { EnvObject } from "@/types/envTypes";

export const envObjectsTable: Table<EnvObject, [number, number]> = db.table("env_objects");

export async function getEnvObject(id: number, environmentId: number): Promise<EnvObject | undefined> {
    return envObjectsTable.get([id, environmentId]);
}

export async function getEnvObjectsByEnvironment(environmentId: number): Promise<EnvObject[]> {
    return envObjectsTable.where("environmentId").equals(environmentId).toArray();
}

export async function saveEnvObject(obj: EnvObject): Promise<void> {
    await envObjectsTable.put(obj);
}

export async function saveEnvObjects(objects: EnvObject[]): Promise<void> {
    await envObjectsTable.bulkPut(objects);
}

export async function deleteEnvObject(id: number, environmentId: number): Promise<void> {
    await envObjectsTable.delete([id, environmentId]);
}

export async function deleteEnvObjectsByEnvironment(environmentId: number): Promise<void> {
    await envObjectsTable.where("environmentId").equals(environmentId).delete();
}

/** Returns the highest object id in the table, or 0 if empty. Used to seed the in-memory id counter. */
export async function getMaxEnvObjectId(): Promise<number> {
    const all = await envObjectsTable.toArray();
    return all.reduce((acc, o) => Math.max(acc, o.id), 0);
}
