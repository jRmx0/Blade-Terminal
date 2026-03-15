import type { EnvFormat, GlobalType as EnvType, ObjectCategory, ObjectType } from "@/config/db-ops/enums";

export type EnvironmentComputationTargetKey = string;

export type EnvironmentComputationValueMap = Record<EnvironmentComputationTargetKey, Record<string, string>>;

export interface EnvironmentComputationConfig {
    selectedProviderId: number | null;
    selectedAlgorithmId: number | null;
    parameterValuesByTarget: EnvironmentComputationValueMap;
}

export interface Environment {
    id: number;
    name: string;
    format: EnvFormat;
    type: EnvType;
    zoneCount: number;
    obstacleCount: number;
    computation: EnvironmentComputationConfig;
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
}

export interface Vertex {
    id: number;
    objectId: number;
    environmentId: number;
    /** Pointer to the next vertex in linked-list order. */
    nextVertexId: number | null;
    x: number;
    y: number;
}
