import type { Table } from "dexie";
import { db } from "./db";
import type { Vertex } from "@/types/schemaTypes";

export const verticesTable: Table<Vertex, [number, number, number]> = db.table("vertices");

export async function getVertex(id: number, objectId: number, environmentId: number): Promise<Vertex | undefined> {
    return verticesTable.get([id, objectId, environmentId]);
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

export async function updateVertex(id: number, objectId: number, environmentId: number, changes: Partial<Vertex>): Promise<void> {
    await verticesTable.update([id, objectId, environmentId], changes);
}

export async function deleteVertex(id: number, objectId: number, environmentId: number): Promise<void> {
    await verticesTable.delete([id, objectId, environmentId]);
}

export async function deleteVerticesByObject(objectId: number): Promise<void> {
    await verticesTable.where("objectId").equals(objectId).delete();
}

export async function deleteVerticesByObjectIds(objectIds: number[]): Promise<void> {
    await verticesTable.where("objectId").anyOf(objectIds).delete();
}


