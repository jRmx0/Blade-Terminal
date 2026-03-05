import type { Table } from "dexie";
import { db } from "./db";
import type { Vertex, Object, Environment } from "@/types/schemaTypes";

const verticesTable: Table<Vertex, [number, number, number]> = db.table("vertices");

export async function getVertex(vertex: Vertex): Promise<Vertex | undefined> {
    return verticesTable.get([vertex.id, vertex.objectId, vertex.environmentId]);
}

export async function getVerticesByObject(obj: Object): Promise<Vertex[]> {
    return verticesTable.where("objectId").equals(obj.id).filter((v) => v.environmentId === obj.environmentId).toArray();
}

export async function getVerticesByObjects(objects: Object[]): Promise<Vertex[]> {
    if (objects.length === 0) return [];
    const environmentId = objects[0]!.environmentId;

    return verticesTable.where("objectId").anyOf(objects.map((o) => o.id)).filter((v) => v.environmentId === environmentId).toArray();
}

export async function saveVertex(vertex: Vertex): Promise<void> {
    await verticesTable.put(vertex);
}

export async function saveVertices(vertices: Vertex[]): Promise<void> {
    await verticesTable.bulkPut(vertices);
}

export async function updateVertex(vertex: Vertex, changes: Partial<Vertex>): Promise<void> {
    await verticesTable.update([vertex.id, vertex.objectId, vertex.environmentId], changes);
}

export async function deleteVertex(vertex: Vertex): Promise<void> {
    await verticesTable.delete([vertex.id, vertex.objectId, vertex.environmentId]);
}

export async function deleteVertices(vertices: Vertex[]): Promise<void> {
    await verticesTable.bulkDelete(vertices.map((v) => [v.id, v.objectId, v.environmentId]));
}

export async function deleteVerticesByObject(obj: Object): Promise<void> {
    await verticesTable.where("objectId").equals(obj.id).filter((v) => v.environmentId === obj.environmentId).delete();
}

export async function deleteVerticesByObjects(objects: Object[]): Promise<void> {
    if (objects.length === 0) return;
    const environmentId = objects[0]!.environmentId;

    await verticesTable.where("objectId").anyOf(objects.map((o) => o.id)).filter((v) => v.environmentId === environmentId).delete();
}

export async function deleteVerticesByEnvironment(env: Environment): Promise<void> {
    await verticesTable.where("environmentId").equals(env.id).delete();
}
