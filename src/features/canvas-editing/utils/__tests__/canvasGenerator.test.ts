import { describe, expect, test } from "bun:test";
import {
    computeResolvedClusteringPct,
    computeResolvedObstacleRatioPct,
    generateEnvironment,
} from "@/features/canvas-editing/utils/canvasGenerator";
import { mulberry32, computeActualObstacleRatioPct } from "./testUtils";

function countFreeComponentsFromEnv(
    env: ReturnType<typeof generateEnvironment>,
    cols: number,
    rows: number,
    cellSize: number,
): number {
    const grid = new Uint8Array(cols * rows);

    for (const polygon of env.obstacles) {
        if (polygon.length === 0) continue;
        const anchor = polygon[0]!;
        const x = Math.floor(anchor.x / cellSize);
        const y = Math.floor(anchor.y / cellSize);
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        grid[y * cols + x] = 1;
    }

    const visited = new Uint8Array(cols * rows);
    const queue: number[] = [];
    let components = 0;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const idx = y * cols + x;
            if (grid[idx] === 1 || visited[idx] === 1) continue;

            components += 1;
            visited[idx] = 1;
            queue.length = 0;
            queue.push(idx);

            for (let q = 0; q < queue.length; q++) {
                const cur = queue[q]!;
                const cx = cur % cols;
                const cy = Math.floor(cur / cols);

                const neighbors: Array<[number, number]> = [
                    [cx + 1, cy],
                    [cx - 1, cy],
                    [cx, cy + 1],
                    [cx, cy - 1],
                ];

                for (const [nx, ny] of neighbors) {
                    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                    const nIdx = ny * cols + nx;
                    if (grid[nIdx] === 1 || visited[nIdx] === 1) continue;
                    visited[nIdx] = 1;
                    queue.push(nIdx);
                }
            }
        }
    }

    return components;
}

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
            const clusteringRatio = Math.floor(rand() * 101);
            const seed = "";

            const env = generateEnvironment({
                width,
                height,
                cellSize,
                obstacleRatio,
                clusteringRatio,
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

describe("resolved random ratios are whole numbers", () => {
    test("auto and range obstacle ratio picks are integers", () => {
        for (let i = 0; i < 100; i++) {
            const seed = `seed-obs-${i}`;
            const auto = computeResolvedObstacleRatioPct(seed);
            const range = computeResolvedObstacleRatioPct(seed, [17, 43]);
            expect(auto).not.toBeNull();
            expect(range).not.toBeNull();
            expect(Number.isInteger(auto!)).toBeTrue();
            expect(Number.isInteger(range!)).toBeTrue();
        }
    });

    test("auto and range clustering picks are integers", () => {
        for (let i = 0; i < 100; i++) {
            const seed = `seed-clust-${i}`;
            const auto = computeResolvedClusteringPct(seed);
            const range = computeResolvedClusteringPct(seed, [8, 72]);
            expect(auto).not.toBeNull();
            expect(range).not.toBeNull();
            expect(Number.isInteger(auto!)).toBeTrue();
            expect(Number.isInteger(range!)).toBeTrue();
        }
    });
});

describe("generateEnvironment - pocket prevention", () => {
    test("keeps free space connected under high clustering across deterministic seeds", () => {
        const width = 200;
        const height = 200;
        const cellSize = 20;
        const cols = width / cellSize;
        const rows = height / cellSize;

        for (let i = 0; i < 300; i++) {
            const seed = `pocket-regression-${i}`;
            const env = generateEnvironment({
                width,
                height,
                cellSize,
                obstacleRatio: 45,
                clusteringRatio: 100,
                seed,
            });

            const freeComponents = countFreeComponentsFromEnv(env, cols, rows, cellSize);
            expect(freeComponents).toBeLessThanOrEqual(1);
        }
    });
});


