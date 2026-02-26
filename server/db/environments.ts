import type { Table } from "dexie";
import { db } from "./db";
import type { Environment } from "@/types/envTypes";
import { WORKSPACE_NAME_MAX_LENGTH } from "@/config/db-ops/databaseConstraintsConfig";

export const environmentsTable: Table<Environment, string> = db.table("environments");

export async function getEnvironment(id: string): Promise<Environment | undefined> {
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

export async function deleteEnvironment(id: string): Promise<void> {
    await environmentsTable.delete(id);
}

/**
 * Returns the next sequential environment id (e.g. "env-4" when the
 * highest existing id is "env-3", or "env-1" when the table is empty).
 */
export async function getNextEnvironmentId(): Promise<string> {
    const all = await environmentsTable.toArray();
    const max = all.reduce((acc, env) => {
        const match = env.id.match(/^env-(\d+)$/);
        const n = match?.[1] ? parseInt(match[1], 10) : 0;
        return Math.max(acc, n);
    }, 0);
    return `env-${max + 1}`;
}
