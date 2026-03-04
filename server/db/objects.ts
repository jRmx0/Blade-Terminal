import type { Table } from "dexie";
import { db } from "./db";
import type { Object } from "@/types/schemaTypes";

export const objectsTable: Table<Object, [number, number]> = db.table("objects");

export async function getObject(id: number, environmentId: number): Promise<Object | undefined> {
    return objectsTable.get([id, environmentId]);
}

export async function getObjectsByEnvironment(environmentId: number): Promise<Object[]> {
    return objectsTable.where("environmentId").equals(environmentId).toArray();
}

export async function saveObject(obj: Object): Promise<void> {
    await objectsTable.put(obj);
}

export async function saveObjects(objects: Object[]): Promise<void> {
    await objectsTable.bulkPut(objects);
}

export async function deleteObject(id: number, environmentId: number): Promise<void> {
    await objectsTable.delete([id, environmentId]);
}

export async function deleteObjectsByEnvironment(environmentId: number): Promise<void> {
    await objectsTable.where("environmentId").equals(environmentId).delete();
}

/** Returns the highest object id in the table, or 0 when empty. Used to seed the in-memory id counter. */
export async function getMaxEnvObjectId(): Promise<number> {
    const last = await objectsTable.orderBy("[id+environmentId]").last();
    return last?.id ?? 0;
}
