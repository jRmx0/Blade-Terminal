/**
 * Canvas generator - re-exports from envGenerator
 *
 * This file maintains backward-compatible imports for callers while the
 * implementation resides in envGenerator.ts.
 */

export {
    generateEnvironment,
    computeResolvedObstacleRatioPct,
    computeResolvedClusteringPct,
    mulberry32,
    type GeneratorParams,
    type GeneratedEnvironment,
} from "@/features/canvas-editing/utils/envGenerator";
