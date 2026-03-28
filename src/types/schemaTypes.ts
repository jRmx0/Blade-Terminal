import type { EnvFormat, GlobalType as EnvType, ObjectCategory, ObjectType } from "@/config/db-ops/enums";

export interface ComputationSelection {
    environmentId: number;
    selectedProviderId: number | null;
    selectedAlgorithmId: number | null;
}

export interface ComputationAlgorithmParameter {
    id: number;
    environmentId: number;
    providerId: number;
    algorithmId: number;
    value: string;
}

export interface Environment {
    id: number;
    name: string;
    format: EnvFormat;
    type: EnvType;
    zoneCount: number;
    obstacleCount: number;
}

export interface Object {
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
    /** Cached: precomputed polygon area (shoelace formula). */
    area: number;
    /** Polygon vertices in draw order. */
    vertices: Array<{ x: number; y: number }>;
}
