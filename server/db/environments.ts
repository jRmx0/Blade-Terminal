import type { Table } from "dexie";
import { db } from "./db";
import type { Environment } from "@/types/schemaTypes";
import { WORKSPACE_NAME_MAX_LENGTH } from "@/config/db-ops/databaseConstraintsConfig";
import { deleteObjectsByEnvironment } from "./objects";
import { deleteParameterValuesByEnvironment } from "./environmentComputationParameterValues";
import { deleteEnvironmentComputation } from "./environmentComputation";

const environmentsTable: Table<Environment, number> = db.table("environments");

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

export async function deleteEnvironment(env: Environment): Promise<void> {
    await deleteObjectsByEnvironment(env);
    await deleteParameterValuesByEnvironment(env.id);
    await deleteEnvironmentComputation(env.id);
    await environmentsTable.delete(env.id);
}

export async function getLastEnvironmentId(): Promise<number> {
    const last = await environmentsTable.orderBy("id").last();
    return last?.id ?? 0;
}
