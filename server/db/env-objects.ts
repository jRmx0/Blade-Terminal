import type { Table } from "dexie";
import { db } from "./db";
import type { EnvObject } from "@/types/envTypes";

export const envObjectsTable: Table<EnvObject, number> = db.table("env_objects");

export async function getEnvObject(id: number): Promise<EnvObject | undefined> {
    return envObjectsTable.get(id);
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

export async function deleteEnvObject(id: number): Promise<void> {
    await envObjectsTable.delete(id);
}

export async function deleteEnvObjectsByEnvironment(environmentId: number): Promise<void> {
    await envObjectsTable.where("environmentId").equals(environmentId).delete();
}
