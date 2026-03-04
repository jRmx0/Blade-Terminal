import type { Table } from "dexie";
import { db } from "./db";
import type { Vertex } from "@/types/schemaTypes";

export const verticesTable: Table<Vertex, [number, number]> = db.table("vertices");

export async function getVertex(id: number, objectId: number): Promise<Vertex | undefined> {
    return verticesTable.get([id, objectId]);
}

export async function getVerticesByObject(objectId: number): Promise<Vertex[]> {
    return verticesTable.where("objectId").equals(objectId).toArray();
}

export async function getVerticesByObjectIds(objectIds: number[]): Promise<Vertex[]> {
    return verticesTable.where("objectId").anyOf(objectIds).toArray();
}

export async function saveVertex(vertex: Vertex): Promise<void> {
    await verticesTable.put(vertex);
}

export async function saveVertices(vertices: Vertex[]): Promise<void> {
    await verticesTable.bulkPut(vertices);
}

export async function updateVertex(id: number, objectId: number, changes: Partial<Vertex>): Promise<void> {
    await verticesTable.update([id, objectId], changes);
}

export async function deleteVertex(id: number, objectId: number): Promise<void> {
    await verticesTable.delete([id, objectId]);
}

export async function deleteVerticesByObject(objectId: number): Promise<void> {
    await verticesTable.where("objectId").equals(objectId).delete();
}

export async function deleteVerticesByObjectIds(objectIds: number[]): Promise<void> {
    await verticesTable.where("objectId").anyOf(objectIds).delete();
}

/** Returns the highest vertex id in the table, or 0 when empty. Used to seed the in-memory id counter. */
export async function getMaxVertexId(): Promise<number> {
    const last = await verticesTable.orderBy("[id+objectId]").last();
    return last?.id ?? 0;
}
