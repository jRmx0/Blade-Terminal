import type { Table } from "dexie";
import { db } from "./db";
import type { Environment } from "@/types/envTypes";
import { WORKSPACE_NAME_MAX_LENGTH } from "@/config/db-ops/databaseConstraintsConfig";

export const environmentsTable: Table<Environment, number> = db.table("environments");

export async function getEnvironment(id: number): Promise<Environment | undefined> {
    return environmentsTable.get(id);
}

export async function getAllEnvironments(): Promise<Environment[]> {
    return environmentsTable.toArray();
}

export async function saveEnvironment(env: Environment): Promise<void> {
    const record: Environment = {
        ...env,
        name: env.name.slice(0, WORKSPACE_NAME_MAX_LENGTH),
    };
    await environmentsTable.put(record);
}

export async function deleteEnvironment(id: number): Promise<void> {
    await environmentsTable.delete(id);
}

/**
 * Returns the next sequential environment id (1 when the table is empty,
 * otherwise max existing id + 1).
 */
export async function getNextEnvironmentId(): Promise<number> {
    const all = await environmentsTable.toArray();
    const max = all.reduce((acc, env) => Math.max(acc, env.id), 0);
    return max + 1;
}
