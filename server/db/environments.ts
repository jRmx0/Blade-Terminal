import type { Table } from "dexie";
import { db } from "./db";
import type { Environment } from "@/types/envTypes";

export const environmentsTable: Table<Environment, string> = db.table("environments");

export async function getEnvironment(id: string): Promise<Environment | undefined> {
    return environmentsTable.get(id);
}

export async function getAllEnvironments(): Promise<Environment[]> {
    return environmentsTable.toArray();
}

export async function saveEnvironment(env: Environment): Promise<void> {
    await environmentsTable.put(env);
}

export async function deleteEnvironment(id: string): Promise<void> {
    await environmentsTable.delete(id);
}
