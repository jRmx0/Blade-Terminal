import { describe, expect, test } from "bun:test";
import { generateEnvironment } from "@/features/canvas-editing/utils/canvasGeneratorV2";
import {
    isPolygonCW,
    isPolygonCCW,
    computePolygonArea,
    areAllPointsWithinBounds,
    isPointInPolygon,
    mulberry32,
    computeActualObstacleRatioPct,
} from "@/features/canvas-editing/utils/__tests__/testUtils";

// ---------------------------------------------------------------------------
// Shared fixture — a modest grid that reliably produces interior obstacles.
// ---------------------------------------------------------------------------
const STANDARD: Parameters<typeof generateEnvironment>[0] = {
    width: 600,
    height: 600,
    minPassageWidth: 60, // 10×10 grid — fast, reproducible
    obstacleRatio: 35,
    clustering: 20,      // low clustering → scattered obstacles, many interior ones
    seed: "tdd-alpha",
};

// ---------------------------------------------------------------------------
// Contract 1: Determinism
// A call with the same explicit seed must always return bit-for-bit identical output.
// ---------------------------------------------------------------------------
describe("generateEnvironment - determinism", () => {
    test("returns identical output for the same explicit seed", () => {
        const a = generateEnvironment(STANDARD);
        const b = generateEnvironment(STANDARD);

        expect(a.boundary).toEqual(b.boundary);
        expect(a.obstacles).toEqual(b.obstacles);
        expect(a.startEndPoint).toEqual(b.startEndPoint);
        expect(a.usedSeedHex).toBe(b.usedSeedHex);
        expect(a.usedObstacleRatioPct).toBe(b.usedObstacleRatioPct);
        expect(a.usedClusteringPct).toBe(b.usedClusteringPct);
    });
});

// ---------------------------------------------------------------------------
// Contract 2: Seed round-trip
// Feeding `usedSeedHex` back as the `seed` must produce the exact same environment.
// ---------------------------------------------------------------------------
describe("generateEnvironment - seed round-trip", () => {
    test("re-using usedSeedHex as seed reproduces the environment exactly", () => {
        const first = generateEnvironment({ ...STANDARD, seed: "round-trip-seed" });
        const second = generateEnvironment({ ...STANDARD, seed: first.usedSeedHex });

        expect(second.boundary).toEqual(first.boundary);
        expect(second.obstacles).toEqual(first.obstacles);
        expect(second.startEndPoint).toEqual(first.startEndPoint);
    });

    test("usedSeedHex is formatted as a hex literal (0x followed by 8 uppercase hex digits)", () => {
        const env = generateEnvironment(STANDARD);
        expect(env.usedSeedHex).toMatch(/^0x[0-9A-F]{8}$/);
    });
});

// ---------------------------------------------------------------------------
// Contract 3: Boundary polygon validity
// The boundary must be a closed, CW-wound polygon with nonzero area that fits
// entirely within the declared canvas dimensions.
// ---------------------------------------------------------------------------
describe("generateEnvironment - boundary validity", () => {
    test("boundary has at least 3 vertices", () => {
        const env = generateEnvironment(STANDARD);
        expect(env.boundary.length).toBeGreaterThanOrEqual(3);
    });

    test("boundary is wound clockwise (positive signed area in screen coords, Y-down)", () => {
        const env = generateEnvironment(STANDARD);
        expect(isPolygonCW(env.boundary)).toBe(true);
    });

    test("boundary has nonzero area", () => {
        const env = generateEnvironment(STANDARD);
        expect(computePolygonArea(env.boundary)).toBeGreaterThan(0);
    });

    test("all boundary vertices fall within canvas bounds [0, width] × [0, height]", () => {
        const env = generateEnvironment(STANDARD);
        expect(areAllPointsWithinBounds(env.boundary, 0, 0, STANDARD.width, STANDARD.height)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Contract 4: Interior obstacle polygon validity
// Every interior obstacle polygon must be CCW-wound with nonzero area.
// The test is conditional — not every seed/ratio produces interior obstacles.
// ---------------------------------------------------------------------------
describe("generateEnvironment - obstacle polygon validity", () => {
    test("each interior obstacle is wound counter-clockwise (negative signed area)", () => {
        const env = generateEnvironment(STANDARD);

        for (const obs of env.obstacles) {
            expect(obs.length).toBeGreaterThanOrEqual(3);
            expect(isPolygonCCW(obs)).toBe(true);
            expect(computePolygonArea(obs)).toBeGreaterThan(0);
        }
    });

    test("all obstacle vertices fall within the boundary bounding box", () => {
        const env = generateEnvironment(STANDARD);

        for (const obs of env.obstacles) {
            expect(areAllPointsWithinBounds(obs, 0, 0, STANDARD.width, STANDARD.height)).toBe(true);
        }
    });
});

// ---------------------------------------------------------------------------
// Contract 5: startEndPoint placement
// The start point must lie inside the navigable boundary and outside every
// interior obstacle.
// ---------------------------------------------------------------------------
describe("generateEnvironment - startEndPoint placement", () => {
    test("startEndPoint is inside the boundary polygon", () => {
        const env = generateEnvironment(STANDARD);
        expect(isPointInPolygon(env.startEndPoint, env.boundary)).toBe(true);
    });

    test("startEndPoint is not inside any obstacle polygon", () => {
        const env = generateEnvironment(STANDARD);

        for (const obs of env.obstacles) {
            expect(isPointInPolygon(env.startEndPoint, obs)).toBe(false);
        }
    });
});

// ---------------------------------------------------------------------------
// Contract 6: usedObstacleRatioPct reflects the caller-specified value
// When obstacleRatio is supplied as an explicit integer, the reported
// usedObstacleRatioPct must equal that integer (no rounding drift).
// ---------------------------------------------------------------------------
describe("generateEnvironment - usedObstacleRatioPct", () => {
    test("equals the explicitly specified obstacleRatio (integer)", () => {
        const ratio = 40;
        const env = generateEnvironment({ ...STANDARD, obstacleRatio: ratio });
        expect(env.usedObstacleRatioPct).toBe(ratio);
    });

    test("is within [0, 100] when obstacleRatio is omitted (seed-derived)", () => {
        const env = generateEnvironment({ ...STANDARD, obstacleRatio: undefined });
        expect(env.usedObstacleRatioPct).toBeGreaterThanOrEqual(0);
        expect(env.usedObstacleRatioPct).toBeLessThanOrEqual(100);
    });
});

// ---------------------------------------------------------------------------
// Contract 7: Degenerate / invalid inputs
// generateEnvironment must never throw. Invalid dimensions return an empty result.
// ---------------------------------------------------------------------------
describe("generateEnvironment - degenerate input", () => {
    test.each([
        { width: 0, height: 500, minPassageWidth: 10, seed: "x", label: "zero width" },
        { width: 500, height: 0, minPassageWidth: 10, seed: "x", label: "zero height" },
        { width: 500, height: 500, minPassageWidth: 0, seed: "x", label: "zero minPassageWidth" },
        { width: -1, height: 500, minPassageWidth: 10, seed: "x", label: "negative width" },
    ])("does not throw and returns boundary:[] for $label", ({ label: _label, ...params }) => {
        expect(() => generateEnvironment(params)).not.toThrow();
        const env = generateEnvironment(params);
        expect(env.boundary).toEqual([]);
        expect(env.obstacles).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// Contract 8: Obstacle ratio measurement
// The actual measured obstacle ratio (by polygon sampling) should be predictable
// and reasonable given the requested parameters.
// ---------------------------------------------------------------------------
describe("generateEnvironment - obstacle ratio measurement", () => {
    test("actual obstacle ratio is reasonable and correlates with requested ratio", () => {
        const width = 1000;
        const height = 1000;
        const cellSize = 20;
        const cols = width / cellSize;
        const rows = height / cellSize;
        const totalCells = cols * rows; // 2500 cells for this grid
        const maxCellDrift = 2; // Algorithm should drift by at most ±2 cells
        const maxDriftPct = (maxCellDrift / totalCells) * 100;

        // Test all ratios from 1 to 100
        const testRatios = Array.from({ length: 100 }, (_, i) => i + 1);
        const actualRatios: number[] = [];

        for (const targetRatio of testRatios) {
            const env = generateEnvironment({
                width,
                height,
                minPassageWidth: cellSize,
                obstacleRatio: targetRatio,
                clustering: 30,
                seed: `obstacle-test-${targetRatio}`,
            });

            const actualRatio = computeActualObstacleRatioPct(env.boundary, env.obstacles, cellSize, cols, rows);
            actualRatios.push(actualRatio);

            // Reported ratio should equal the target
            expect(env.usedObstacleRatioPct).toBe(targetRatio);
            // Actual ratio should be within ±2 cells tolerance of the target
            // If this fails, the algorithm's stabilization is drifting too much
            expect(Math.abs(actualRatio - targetRatio)).toBeLessThanOrEqual(maxDriftPct + 1e-9);
        }

        // Higher target ratios should generally produce higher actual ratios
        // Check that low (1%), medium (50%), and high (100%) show monotonic trend
        expect(actualRatios[49]!).toBeGreaterThan(actualRatios[0]!);   // 50% > 1%
        expect(actualRatios[99]!).toBeGreaterThan(actualRatios[49]!);  // 100% > 50%
    });
});
