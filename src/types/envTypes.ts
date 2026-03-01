import type { EnvFormat, ObjectCategory, ObjectType } from "@/config/db-ops/enums";

export interface Environment {
    id: number;
    name: string;
    format: EnvFormat;
    type: ObjectType;
    zoneObjectCount: number;
    obstacleObjectCount: number;
}

export interface EnvObject {
    id: number;
    environmentId: number;
    category: ObjectCategory;
    /**
     * Vertex winding convention (in screen coordinates, Y increases downward):
     * - `zone`     → vertices inserted **clockwise** (positive signed area)
     * - `obstacle` → vertices inserted **counter-clockwise** (negative signed area)
     */
    type: ObjectType;
    /** Cached: precomputed number of vertices. */
    vertexCount: number;
    /** Cached: precomputed polygon area (shoelace formula). Always positive. */
    area: number;
}

export interface EnvVertex {
    id: number;
    objectId: number;
    /** Pointer to the next vertex in linked-list order. Null for the tail vertex. */
    nextVertexId: number | null;
    x: number;
    y: number;
}
