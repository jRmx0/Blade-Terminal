import { describe, expect, test } from "bun:test";
import { generateEnvironment, validateCellSizeFit } from "@/features/canvas-editing/utils/canvasGenerator";
import { mulberry32, computeActualObstacleRatioPct } from "./testUtils";

describe("generateEnvironment - obstacle ratio calibration", () => {
    test("keeps specified and actual obstacle ratio within one cell for 100 random env", () => {
        const rand = mulberry32(0xC0FFEE);

        for (let i = 0; i < 100; i++) {
            const width = 1000;
            const height = 1000;
            const cellSize = 20;
            const cols = width / cellSize;
            const rows = height / cellSize;
            const obstacleRatio = Math.floor(rand() * 101);
            const clustering = Math.floor(rand() * 101);
            const seed = "";

            const env = generateEnvironment({
                width,
                height,
                minPassageWidth: cellSize,
                obstacleRatio,
                clustering,
                seed,
            });

            const actualRatio = computeActualObstacleRatioPct(env.boundary, env.obstacles, cellSize, cols, rows);
            const oneCellTolerancePct = 100 / Math.min(cols, rows);

            // The actual measured ratio should match what the generator claims it used,
            // within ±1 cell size tolerance
            expect(Math.abs(actualRatio - env.usedObstacleRatioPct)).toBeLessThanOrEqual(oneCellTolerancePct + 1e-9);
        }
    });
});

describe("validateCellSizeFit - cell size fit validation", () => {
    test("returns null when width or height are not present/invalid", () => {
        expect(validateCellSizeFit(0, 1000, 20)).toBeNull();
        expect(validateCellSizeFit(-100, 1000, 20)).toBeNull();
        expect(validateCellSizeFit(NaN, 1000, 20)).toBeNull();
        expect(validateCellSizeFit(1000, 0, 20)).toBeNull();
        expect(validateCellSizeFit(1000, -100, 20)).toBeNull();
        expect(validateCellSizeFit(1000, NaN, 20)).toBeNull();
    });

    test("returns null when cell size is not present/invalid", () => {
        expect(validateCellSizeFit(1000, 1000, 0)).toBeNull();
        expect(validateCellSizeFit(1000, 1000, -10)).toBeNull();
        expect(validateCellSizeFit(1000, 1000, NaN)).toBeNull();
    });

    test("returns null for perfectly divisible dimensions with 2x2+ grid", () => {
        expect(validateCellSizeFit(40, 40, 20)).toBeNull(); // 2x2 grid
        expect(validateCellSizeFit(40, 80, 20)).toBeNull(); // 2x4 grid
        expect(validateCellSizeFit(80, 40, 20)).toBeNull(); // 4x2 grid
        expect(validateCellSizeFit(100, 100, 25)).toBeNull(); // 4x4 grid
        expect(validateCellSizeFit(600, 600, 30)).toBeNull(); // 20x20 grid
    });

    test("returns divisibility error when width is not a multiple of cell size", () => {
        const result = validateCellSizeFit(50, 40, 20);
        expect(result).toBeTruthy();
        expect(result).toContain("evenly");
    });

    test("returns divisibility error when height is not a multiple of cell size", () => {
        const result = validateCellSizeFit(40, 50, 20);
        expect(result).toBeTruthy();
        expect(result).toContain("evenly");
    });

    test("returns divisibility error when both are not multiples", () => {
        const result = validateCellSizeFit(50, 50, 20);
        expect(result).toBeTruthy();
        expect(result).toContain("evenly");
    });

    test("returns grid size error when cell is too large (1x1 grid)", () => {
        const result = validateCellSizeFit(100, 100, 100);
        expect(result).toBeTruthy();
        expect(result).toContain("at least 2");
    });

    test("returns grid size error when cell is too large (1x2 grid)", () => {
        const result = validateCellSizeFit(40, 80, 40);
        expect(result).toBeTruthy();
        expect(result).toContain("at least 2");
    });

    test("returns grid size error when cell is too large (2x1 grid)", () => {
        const result = validateCellSizeFit(80, 40, 40);
        expect(result).toBeTruthy();
        expect(result).toContain("at least 2");
    });

    test("tolerates small floating-point errors in divisibility", () => {
        // 40 / 20 = 2 exactly, but due to float representation might be 1.9999999
        expect(validateCellSizeFit(40.0000000001, 40, 20)).toBeNull();
        expect(validateCellSizeFit(40, 40.0000000001, 20)).toBeNull();
    });

    test("rejects non-trivial remainder beyond tolerance", () => {
        expect(validateCellSizeFit(40.1, 40, 20)).toBeTruthy();
        expect(validateCellSizeFit(40, 40.1, 20)).toBeTruthy();
    });

    test("returns null at exact 2x2 boundary (smallest valid grid)", () => {
        // 40 / 20 = 2 cells on each axis (valid)
        expect(validateCellSizeFit(40, 40, 20)).toBeNull();
    });

    test("returns null when exactly 2x2+ cells exist", () => {
        // 50 cells × 50 cells ÷ 25 cells per side = 2×2 grid (edge case that should be invalid due to divisibility)
        // But 50 ÷ 25 = 2 exactly, so this is valid
        expect(validateCellSizeFit(50, 50, 25)).toBeNull();
    });
});

