import type { Table } from "dexie";
import { db } from "./db";
import type { Environment } from "@/types/envTypes";
import { WORKSPACE_NAME_MAX_LENGTH } from "@/config/db-ops/databaseConstraintsConfig";
import { deleteEnvObjectsByEnvironment, getEnvObjectsByEnvironment } from "./env-objects";
import { deleteEnvVerticesByObjectIds } from "./env-vertices";

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

/**
 * Deletes an environment and all its associated objects and vertices.
 */
export async function deleteEnvironmentCascade(id: number): Promise<void> {
    const objects = await getEnvObjectsByEnvironment(id);
    if (objects.length > 0) {
        await deleteEnvVerticesByObjectIds(objects.map((o) => o.id));
        await deleteEnvObjectsByEnvironment(id);
    }
    await environmentsTable.delete(id);
}

/** Returns the highest environment id stored, or 0 when the table is empty. */
export async function getMaxEnvironmentId(): Promise<number> {
    const last = await environmentsTable.orderBy("id").last();
    return last?.id ?? 0;
}
