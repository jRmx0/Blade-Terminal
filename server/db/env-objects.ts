import type { Table } from "dexie";
import { db } from "./db";
import type { EnvObject } from "@/types/envTypes";

export const envObjectsTable: Table<EnvObject, string> = db.table("env_objects");

export async function getEnvObject(id: string): Promise<EnvObject | undefined> {
    return envObjectsTable.get(id);
}

export async function getEnvObjectsByEnvironment(environmentId: string): Promise<EnvObject[]> {
    return envObjectsTable.where("environmentId").equals(environmentId).toArray();
}

export async function saveEnvObject(obj: EnvObject): Promise<void> {
    await envObjectsTable.put(obj);
}

export async function saveEnvObjects(objects: EnvObject[]): Promise<void> {
    await envObjectsTable.bulkPut(objects);
}

export async function deleteEnvObject(id: string): Promise<void> {
    await envObjectsTable.delete(id);
}

export async function deleteEnvObjectsByEnvironment(environmentId: string): Promise<void> {
    await envObjectsTable.where("environmentId").equals(environmentId).delete();
}
