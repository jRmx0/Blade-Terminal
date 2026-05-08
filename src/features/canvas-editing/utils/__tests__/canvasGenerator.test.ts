import { describe, test, expect } from "bun:test";
import {
    generateEnvironment,
    computeResolvedObstacleRatioPct,
    computeResolvedClusteringPct,
} from "@/features/canvas-editing/utils/canvasGenerator";
import {
    isPointInPolygon,
    isPolygonCCW,
    isPolygonCW,
    isPolygonClosed,
    areAllPointsWithinBounds,
    getBoundingBox,
    computePolygonArea,
    minDistanceToPolygon,
} from "./testUtils";

// ============================================================================
// Phase 1: PRNG & Seed Handling
// ============================================================================

describe("Seed & Parameter Resolution", () => {
    describe("computeResolvedObstacleRatioPct", () => {
        test("returns null for blank seed", () => {
            expect(computeResolvedObstacleRatioPct("")).toBe(null);
            expect(computeResolvedObstacleRatioPct("   ")).toBe(null);
        });

        test("deterministic for same seed", () => {
            const v1 = computeResolvedObstacleRatioPct("test-seed");
            const v2 = computeResolvedObstacleRatioPct("test-seed");
            expect(v1).toBe(v2);
            expect(v1).not.toBe(null);
        });

        test("picks within auto-range [5, 60]% when undefined", () => {
            const v = computeResolvedObstacleRatioPct("seed");
            expect(v).toBeGreaterThanOrEqual(5);
            expect(v).toBeLessThanOrEqual(60);
        });

        test("picks within specified range", () => {
            const v = computeResolvedObstacleRatioPct("seed", [25, 75]);
            expect(v).toBeGreaterThanOrEqual(25);
            expect(v).toBeLessThanOrEqual(75);
        });

        test("handles reversed range", () => {
            const v = computeResolvedObstacleRatioPct("seed", [75, 25]);
            expect(v).toBeGreaterThanOrEqual(25);
            expect(v).toBeLessThanOrEqual(75);
        });

        test("handles single percentage value", () => {
            const v = computeResolvedObstacleRatioPct("seed", [50, 50]);
            expect(v).toBe(50);
        });

        test("handles out-of-range values by allowing them within the specified range", () => {
            // Negative values in range get clamped to 0 during fraction calculation
            const v1 = computeResolvedObstacleRatioPct("seed", [-10, 50]);
            expect(v1).toBeGreaterThanOrEqual(0);
            expect(v1).toBeLessThanOrEqual(50);

            // Values > 100 are allowed in ranges (clamping happens at fraction level)
            const v2 = computeResolvedObstacleRatioPct("seed", [50, 150]);
            expect(v2).toBeGreaterThanOrEqual(50);
            // Allow values exceeding 100 since range allows it
            expect(v2).toBeLessThanOrEqual(150);
        });

        test("hex seed round-trips identically", () => {
            const v1 = computeResolvedObstacleRatioPct("0xDEADBEEF");
            const v2 = computeResolvedObstacleRatioPct("0xDEADBEEF");
            expect(v1).toBe(v2);
        });
    });

    describe("computeResolvedClusteringPct", () => {
        test("returns null for blank seed", () => {
            expect(computeResolvedClusteringPct("")).toBe(null);
        });

        test("deterministic for same seed", () => {
            const v1 = computeResolvedClusteringPct("test");
            const v2 = computeResolvedClusteringPct("test");
            expect(v1).toBe(v2);
        });

        test("picks within full range [0, 100]% when undefined", () => {
            const v = computeResolvedClusteringPct("seed");
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(100);
        });

        test("picks within specified range", () => {
            const v = computeResolvedClusteringPct("seed", [10, 50]);
            expect(v).toBeGreaterThanOrEqual(10);
            expect(v).toBeLessThanOrEqual(50);
        });
    });
});

// ============================================================================
// Phase 2: Core Generator Output Structure & Determinism
// ============================================================================

describe("generateEnvironment - Output Structure", () => {
    test("returns valid structure for normal inputs", () => {
        const env = generateEnvironment({
            width: 1000,
            height: 800,
            minPassageWidth: 50,
            seed: "test",
        });

        expect(env).toHaveProperty("boundary");
        expect(Array.isArray(env.boundary)).toBe(true);

        expect(env).toHaveProperty("obstacles");
        expect(Array.isArray(env.obstacles)).toBe(true);
        for (const obs of env.obstacles) {
            expect(Array.isArray(obs)).toBe(true);
        }

        expect(env).toHaveProperty("startEndPoint");
        expect(typeof env.startEndPoint.x).toBe("number");
        expect(typeof env.startEndPoint.y).toBe("number");

        expect(env).toHaveProperty("usedClusteringPct");
        expect(typeof env.usedClusteringPct).toBe("number");

        expect(env).toHaveProperty("usedObstacleRatioPct");
        expect(typeof env.usedObstacleRatioPct).toBe("number");

        expect(env).toHaveProperty("usedSeedHex");
        expect(env.usedSeedHex).toMatch(/^0x[0-9A-F]{8}$/);
    });

    test("produces identical output for same seed", () => {
        const params = {
            width: 1000,
            height: 800,
            minPassageWidth: 50,
            obstacleRatio: 30,
            clustering: 50,
            seed: "reproducible-seed",
        };

        const env1 = generateEnvironment(params);
        const env2 = generateEnvironment(params);

        expect(env1.boundary).toEqual(env2.boundary);
        expect(env1.obstacles).toEqual(env2.obstacles);
        expect(env1.startEndPoint).toEqual(env2.startEndPoint);
        expect(env1.usedClusteringPct).toBe(env2.usedClusteringPct);
        expect(env1.usedObstacleRatioPct).toBe(env2.usedObstacleRatioPct);
        expect(env1.usedSeedHex).toBe(env2.usedSeedHex);
    });

    test("different seeds produce different environments", () => {
        const params1 = {
            width: 1000,
            height: 800,
            minPassageWidth: 50,
            seed: "seed-1",
        };

        const params2 = {
            width: 1000,
            height: 800,
            minPassageWidth: 50,
            seed: "seed-2",
        };

        const env1 = generateEnvironment(params1);
        const env2 = generateEnvironment(params2);

        // At least one aspect should differ
        const boundarysDiffer = !arraysEqual(env1.boundary, env2.boundary);
        const seedsDiffer = env1.usedSeedHex !== env2.usedSeedHex;
        expect(boundarysDiffer || seedsDiffer).toBe(true);
    });

    test("respects explicit parameter values over seed-derived defaults", () => {
        const env = generateEnvironment({
            width: 800,
            height: 800,
            minPassageWidth: 50,
            obstacleRatio: 40,
            clustering: 70,
            seed: "test",
        });

        // Obstacle ratio should be close to 40%
        expect(Math.abs(env.usedObstacleRatioPct - 40)).toBeLessThan(5);

        // Clustering should be close to 70%
        expect(Math.abs(env.usedClusteringPct - 70)).toBeLessThan(5);
    });
});

// ============================================================================
// Phase 3: Polygon Geometry Validation
// ============================================================================

describe("generateEnvironment - Polygon Geometry", () => {
    test("boundary polygon is non-empty and forms a valid polygon", () => {
        const env = generateEnvironment({
            width: 500,
            height: 500,
            minPassageWidth: 50,
            seed: "geo-test-1",
        });

        expect(env.boundary.length).toBeGreaterThan(2);
        // Verify vertices are numbers
        for (const p of env.boundary) {
            expect(typeof p.x).toBe("number");
            expect(typeof p.y).toBe("number");
        }
    });

    test("boundary polygon is clockwise (CW)", () => {
        const env = generateEnvironment({
            width: 500,
            height: 500,
            minPassageWidth: 50,
            seed: "geo-test-2",
        });

        // In screen coords (Y down), zone boundary should be CW (positive signed area)
        expect(isPolygonCW(env.boundary)).toBe(true);
    });

    test("boundary vertices are within canvas bounds", () => {
        const width = 1000;
        const height = 800;
        const env = generateEnvironment({
            width,
            height,
            minPassageWidth: 50,
            seed: "bounds-test",
        });

        expect(
            areAllPointsWithinBounds(env.boundary, 0, 0, width, height),
        ).toBe(true);
    });

    test("obstacle polygons are valid and CCW", () => {
        const env = generateEnvironment({
            width: 1000,
            height: 1000,
            minPassageWidth: 50,
            obstacleRatio: 50,
            seed: "obstacle-geo-test",
        });

        for (const obstacle of env.obstacles) {
            expect(obstacle.length).toBeGreaterThan(2);
            // Verify all vertices are numbers
            for (const p of obstacle) {
                expect(typeof p.x).toBe("number");
                expect(typeof p.y).toBe("number");
            }
            // Obstacle polygons should be CCW (negative signed area in screen coords)
            expect(isPolygonCCW(obstacle)).toBe(true);
        }
    });

    test("obstacle vertices are within canvas bounds", () => {
        const width = 800;
        const height = 600;
        const env = generateEnvironment({
            width,
            height,
            minPassageWidth: 40,
            obstacleRatio: 30,
            seed: "obstacle-bounds",
        });

        for (const obstacle of env.obstacles) {
            expect(areAllPointsWithinBounds(obstacle, 0, 0, width, height)).toBe(
                true,
            );
        }
    });

    test("start point is within canvas bounds", () => {
        const width = 800;
        const height = 600;
        const env = generateEnvironment({
            width,
            height,
            minPassageWidth: 50,
            seed: "start-point-test",
        });

        const p = env.startEndPoint;
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(width);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(height);
    });

    test("start point is far from canvas edges", () => {
        const env = generateEnvironment({
            width: 500,
            height: 500,
            minPassageWidth: 50,
            seed: "free-space-test",
        });

        const p = env.startEndPoint;
        // Start point should be interior, not on edges
        expect(p.x).toBeGreaterThan(500 * 0.1);
        expect(p.x).toBeLessThan(500 * 0.9);
        expect(p.y).toBeGreaterThan(500 * 0.1);
        expect(p.y).toBeLessThan(500 * 0.9);
    });

    test("start point is away from obstacles", () => {
        const env = generateEnvironment({
            width: 800,
            height: 800,
            minPassageWidth: 40,
            obstacleRatio: 40,
            seed: "start-distance",
        });

        const p = env.startEndPoint;

        // Start point should have decent distance from obstacles
        for (const obstacle of env.obstacles) {
            const minDist = minDistanceToPolygon(p, obstacle);
            expect(minDist).toBeGreaterThan(0);
        }
    });
});

// ============================================================================
// Phase 4: Obstacle Density Calibration
// ============================================================================

describe("generateEnvironment - Obstacle Density", () => {
    test("respects low obstacle ratio target", () => {
        const env = generateEnvironment({
            width: 1000,
            height: 1000,
            minPassageWidth: 50,
            obstacleRatio: 10,
            seed: "density-low",
        });

        expect(env.usedObstacleRatioPct).toBeGreaterThanOrEqual(5);
        expect(env.usedObstacleRatioPct).toBeLessThanOrEqual(15);
    });

    test("respects medium obstacle ratio target", () => {
        const env = generateEnvironment({
            width: 1000,
            height: 1000,
            minPassageWidth: 50,
            obstacleRatio: 50,
            seed: "density-med",
        });

        expect(env.usedObstacleRatioPct).toBeGreaterThanOrEqual(45);
        expect(env.usedObstacleRatioPct).toBeLessThanOrEqual(55);
    });

    test("respects high obstacle ratio target", () => {
        const env = generateEnvironment({
            width: 1000,
            height: 1000,
            minPassageWidth: 50,
            obstacleRatio: 80,
            seed: "density-high",
        });

        expect(env.usedObstacleRatioPct).toBeGreaterThanOrEqual(75);
        expect(env.usedObstacleRatioPct).toBeLessThanOrEqual(100);
    });

    test("handles seed-derived density", () => {
        const env = generateEnvironment({
            width: 800,
            height: 800,
            minPassageWidth: 50,
            seed: "seed-density",
            // obstacleRatio undefined: derived from seed
        });

        expect(env.usedObstacleRatioPct).toBeGreaterThanOrEqual(5);
        expect(env.usedObstacleRatioPct).toBeLessThanOrEqual(60);
    });
});

// ============================================================================
// Phase 5: Edge Cases
// ============================================================================

describe("generateEnvironment - Edge Cases", () => {
    test("handles zero width gracefully", () => {
        const env = generateEnvironment({
            width: 0,
            height: 100,
            minPassageWidth: 50,
            seed: "invalid-width",
        });

        expect(env.boundary).toEqual([]);
        expect(env.obstacles).toEqual([]);
    });

    test("handles zero height gracefully", () => {
        const env = generateEnvironment({
            width: 100,
            height: 0,
            minPassageWidth: 50,
            seed: "invalid-height",
        });

        expect(env.boundary).toEqual([]);
        expect(env.obstacles).toEqual([]);
    });

    test("handles negative dimensions gracefully", () => {
        const env = generateEnvironment({
            width: -100,
            height: 100,
            minPassageWidth: 50,
            seed: "negative-width",
        });

        expect(env.boundary).toEqual([]);
        expect(env.obstacles).toEqual([]);
    });

    test("handles zero minPassageWidth gracefully", () => {
        const env = generateEnvironment({
            width: 500,
            height: 500,
            minPassageWidth: 0,
            seed: "zero-passage",
        });

        expect(env.boundary).toEqual([]);
        expect(env.obstacles).toEqual([]);
    });

    test("handles blank seed (non-deterministic fallback)", () => {
        const env1 = generateEnvironment({
            width: 500,
            height: 500,
            minPassageWidth: 50,
            seed: "",
        });

        const env2 = generateEnvironment({
            width: 500,
            height: 500,
            minPassageWidth: 50,
            seed: "",
        });

        // Both should return a valid structure without throwing.
        expect(Array.isArray(env1.boundary)).toBe(true);
        expect(Array.isArray(env1.obstacles)).toBe(true);
        expect(env1.startEndPoint).toBeDefined();

        expect(Array.isArray(env2.boundary)).toBe(true);
        expect(Array.isArray(env2.obstacles)).toBe(true);
        expect(env2.startEndPoint).toBeDefined();
    });

    test("handles obstacle ratio 0%", () => {
        const env = generateEnvironment({
            width: 500,
            height: 500,
            minPassageWidth: 50,
            obstacleRatio: 0,
            seed: "ratio-zero",
        });

        // Should have few/no obstacles (start point must be free)
        expect(env.usedObstacleRatioPct).toBeLessThanOrEqual(5);
    });

    test("handles obstacle ratio 100%", () => {
        const env = generateEnvironment({
            width: 500,
            height: 500,
            minPassageWidth: 50,
            obstacleRatio: 100,
            seed: "ratio-max",
        });

        // Should have many obstacles, but start point still accessible
        expect(env.startEndPoint).toBeDefined();
        const minDistToBoundary = minDistanceToPolygon(env.startEndPoint, env.boundary);
        expect(minDistToBoundary).toBeLessThanOrEqual(50);
    });

    test("handles clustering 0% (isolated seeds)", () => {
        const env = generateEnvironment({
            width: 600,
            height: 600,
            minPassageWidth: 40,
            clustering: 0,
            seed: "cluster-isolated",
        });

        expect(env.boundary.length).toBeGreaterThan(0);
        // With 0% clustering, obstacles should be more spread out
        expect(env.usedClusteringPct).toBeLessThanOrEqual(5);
    });

    test("handles clustering 100% (single blob)", () => {
        const env = generateEnvironment({
            width: 600,
            height: 600,
            minPassageWidth: 40,
            clustering: 100,
            seed: "cluster-blob",
        });

        expect(env.boundary.length).toBeGreaterThan(0);
        // With 100% clustering, obstacles should form cohesive groups
        expect(env.usedClusteringPct).toBeGreaterThanOrEqual(95);
    });

    test("handles very small grid (2x2)", () => {
        const env = generateEnvironment({
            width: 100,
            height: 100,
            minPassageWidth: 80,
            seed: "tiny-grid",
        });

        expect(env.boundary.length).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(env.obstacles)).toBe(true);
    });

    test("handles very large dimensions", () => {
        const env = generateEnvironment({
            width: 10000,
            height: 10000,
            minPassageWidth: 50,
            seed: "large-dims",
        });

        // Should scale cell size to respect MAX_GRID_CELLS
        expect(env.boundary.length).toBeGreaterThan(0);
        expect(env.startEndPoint).toBeDefined();
    });

    test("handles range obstacle ratio", () => {
        const env = generateEnvironment({
            width: 600,
            height: 600,
            minPassageWidth: 50,
            obstacleRatio: [20, 40],
            seed: "ratio-range",
        });

        expect(env.usedObstacleRatioPct).toBeGreaterThanOrEqual(15);
        expect(env.usedObstacleRatioPct).toBeLessThanOrEqual(45);
    });

    test("handles range clustering", () => {
        const env = generateEnvironment({
            width: 600,
            height: 600,
            minPassageWidth: 50,
            clustering: [30, 70],
            seed: "cluster-range",
        });

        expect(env.usedClusteringPct).toBeGreaterThanOrEqual(25);
        expect(env.usedClusteringPct).toBeLessThanOrEqual(75);
    });
});

// ============================================================================
// Helpers
// ============================================================================

function arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((v, i) => JSON.stringify(v) === JSON.stringify(b[i]));
}
