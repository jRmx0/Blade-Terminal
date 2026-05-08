import { describe, expect, test } from "bun:test";
import { generateEnvironment } from "@/features/canvas-editing/utils/canvasGenerator";
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
