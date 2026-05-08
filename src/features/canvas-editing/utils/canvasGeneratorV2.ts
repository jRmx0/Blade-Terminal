import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";

// ---------------------------------------------------------------------------
// Public interface types
// ---------------------------------------------------------------------------

export interface GeneratorParams {
    width: number;
    height: number;
    /** Minimum navigable clearance width. Governs the resolution of the grid. */
    minPassageWidth: number;
    /**
     * Obstacle density as a percentage [0, 100], or a [min, max] range the
     * generator picks from deterministically using the seed.
     * When omitted, density is derived from the seed.
     */
    obstacleRatio?: number | [number, number];
    /**
     * Clustering tendency as a percentage [0, 100], or a [min, max] range the
     * generator picks from deterministically using the seed.
     * 0 = every obstacle is an isolated cell (maximum spread).
     * 100 = obstacles expand into one large connected blob.
     * When omitted, derived from the seed.
     */
    clustering?: number | [number, number];
    /** Arbitrary string seed. Blank ⇒ random per call; hex literal (0x…) round-trips exactly. */
    seed: string;
}

export interface GeneratedEnvironment {
    /** CW-wound outer boundary polygon of the navigable zone in pixel coordinates. */
    boundary: Point[];
    /** CCW-wound interior obstacle polygons in pixel coordinates. */
    obstacles: Point[][];
    /** Pixel-space point inside the deepest free region — best robot start location. */
    startEndPoint: Point;
    /** Clustering percentage [0, 100] actually used during this generation. */
    usedClusteringPct: number;
    /**
     * Obstacle ratio percentage [0, 100] targeted during this generation.
     * Reflects the explicitly supplied value or the seed-derived auto value.
     */
    usedObstacleRatioPct: number;
    /** The resolved 32-bit seed as a hex literal (e.g. `0x8A3F1C2D`). Reproduces the environment exactly. */
    usedSeedHex: string;
}

// ---------------------------------------------------------------------------
// Exported preview helpers (used by the UI to preview resolved values)
// ---------------------------------------------------------------------------

/** Range for auto-generated obstacle ratio when seed is deterministic. */
const AUTO_RATIO_MIN = 5;
const AUTO_RATIO_RANGE = 55; // → [5, 60]%

/** FNV-1a 32-bit hash. Hex literals (0x…) are parsed directly. */
function hashSeed(s: string): number {
    if (/^0x[0-9a-f]+$/i.test(s.trim())) return parseInt(s.trim(), 16) >>> 0;
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** mulberry32 seeded PRNG. */
function mulberry32(seed: number): () => number {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Returns the obstacle ratio percentage that will be used for a given seed.
 * Returns `null` when the seed is blank (value would differ on every call).
 */
export function computeResolvedObstacleRatioPct(seed: string, range?: [number, number]): number | null {
    if (!seed.trim()) return null;
    const draw = mulberry32(hashSeed(seed.trim()) ^ 0x9e3779b9)();
    if (range !== undefined) {
        const lo = Math.min(range[0], range[1]);
        const hi = Math.max(range[0], range[1]);
        return Math.round(lo + draw * (hi - lo));
    }
    return Math.round(AUTO_RATIO_MIN + draw * AUTO_RATIO_RANGE);
}

/**
 * Returns the clustering percentage that will be used for a given seed.
 * Returns `null` when the seed is blank.
 */
export function computeResolvedClusteringPct(seed: string, range?: [number, number]): number | null {
    if (!seed.trim()) return null;
    const draw = mulberry32(hashSeed(seed.trim()))();
    if (range !== undefined) {
        const lo = Math.min(range[0], range[1]);
        const hi = Math.max(range[0], range[1]);
        return Math.round(lo + draw * (hi - lo));
    }
    return Math.round(draw * 100);
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Maximum grid cells to prevent performance issues on large / fine-grained inputs. */
const MAX_GRID_CELLS = 40_000;

const DIRS4: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// ---------------------------------------------------------------------------
// Grid: diagonal gap closure
//
// For every 2×2 block where exactly two diagonally-opposite cells are obstacles,
// fills one free cell to close the zero-width corner gap (which would permit a
// passage narrower than minPassageWidth).
//
// Returns true when at least one cell was changed so the caller can decide
// whether to run another stabilisation pass.
// ---------------------------------------------------------------------------
function closeDiagonals(free: boolean[][], rows: number, cols: number): boolean {
    let anyChanged = false;
    let changed = true;
    while (changed) {
        changed = false;
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const tl = !free[r]![c];
                const tr = !free[r]![c + 1];
                const bl = !free[r + 1]![c];
                const br = !free[r + 1]![c + 1];
                // TL+BR diagonal — fill TR to close the corner
                if (tl && br && !tr && !bl) { free[r]![c + 1] = false; changed = true; anyChanged = true; }
                // TR+BL diagonal — fill TL
                else if (tr && bl && !tl && !br) { free[r]![c] = false; changed = true; anyChanged = true; }
            }
        }
    }
    return anyChanged;
}

// ---------------------------------------------------------------------------
// Grid: BFS flood-fill from (startC, startR)
//
// Returns a flat Uint8Array[rows*cols]: 1 = reachable free cell, 0 = not.
// ---------------------------------------------------------------------------
function floodFill(
    free: boolean[][],
    rows: number,
    cols: number,
    startC: number,
    startR: number,
): Uint8Array {
    const reachable = new Uint8Array(rows * cols);
    const startIdx = startR * cols + startC;
    reachable[startIdx] = 1;
    const queue: number[] = [startIdx];
    let head = 0;
    while (head < queue.length) {
        const idx = queue[head++]!;
        const r = Math.floor(idx / cols), c = idx % cols;
        for (const [dr, dc] of DIRS4) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const ni = nr * cols + nc;
                if (!reachable[ni] && free[nr]![nc]) {
                    reachable[ni] = 1;
                    queue.push(ni);
                }
            }
        }
    }
    return reachable;
}

// ---------------------------------------------------------------------------
// Grid: connected-component labelling for obstacle cells
// ---------------------------------------------------------------------------
type ObstacleComponent = { cells: Array<[number, number]>; isBorder: boolean };

function findObstacleComponents(
    free: boolean[][],
    rows: number,
    cols: number,
): ObstacleComponent[] {
    const visited = new Uint8Array(rows * cols);
    const components: ObstacleComponent[] = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (free[r]![c] || visited[r * cols + c]) continue;

            const cells: Array<[number, number]> = [];
            let isBorder = false;
            const queue: number[] = [r * cols + c];
            visited[r * cols + c] = 1;
            let head = 0;

            while (head < queue.length) {
                const idx = queue[head++]!;
                const cr = Math.floor(idx / cols), cc = idx % cols;
                cells.push([cr, cc]);
                if (cr === 0 || cr === rows - 1 || cc === 0 || cc === cols - 1) isBorder = true;
                for (const [dr, dc] of DIRS4) {
                    const nr = cr + dr, nc = cc + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        const ni = nr * cols + nc;
                        if (!free[nr]![nc] && !visited[ni]) {
                            visited[ni] = 1;
                            queue.push(ni);
                        }
                    }
                }
            }
            components.push({ cells, isBorder });
        }
    }
    return components;
}

// ---------------------------------------------------------------------------
// Polygon: walk a directed half-edge map into a simplified pixel polygon.
//
// Both obstacle (CCW) and zone (CW) tracing produce a directed half-edge map
// (start-vertex-encoded → end-vertex-encoded). This shared helper walks the
// closed chain, strips collinear intermediate vertices, and converts grid
// vertex coordinates to pixel coordinates.
// ---------------------------------------------------------------------------
function walkEdgeChain(
    edgeMap: Map<number, number>,
    cols2: number,
    cellSize: number,
): Point[] {
    if (edgeMap.size === 0) return [];

    const rawPolygon: Array<[number, number]> = [];
    const startEnc = edgeMap.keys().next().value!;
    let cur = startEnc;
    do {
        rawPolygon.push([Math.floor(cur / cols2), cur % cols2]);
        cur = edgeMap.get(cur)!;
        if (rawPolygon.length > edgeMap.size + 2) break; // safety guard
    } while (cur !== startEnc);

    const n = rawPolygon.length;
    const polygon: Point[] = [];
    for (let i = 0; i < n; i++) {
        const [pr, pc] = rawPolygon[(i - 1 + n) % n]!;
        const [cr, cc] = rawPolygon[i]!;
        const [nr, nc] = rawPolygon[(i + 1) % n]!;
        const collinear = (pr === cr && cr === nr) || (pc === cc && cc === nc);
        if (!collinear) polygon.push({ x: cc * cellSize, y: cr * cellSize });
    }
    return polygon;
}

// ---------------------------------------------------------------------------
// Polygon: CCW boundary tracing for a single interior obstacle component.
//
// Directed edge rules (obstacle interior on LEFT, Y down → CCW = negative area):
//   Top    (free above):  enc(r,   c+1) → enc(r,   c  )
//   Bottom (free below):  enc(r+1, c  ) → enc(r+1, c+1)
//   Left   (free left):   enc(r,   c  ) → enc(r+1, c  )
//   Right  (free right):  enc(r+1, c+1) → enc(r,   c+1)
// ---------------------------------------------------------------------------
function traceObstaclePolygon(
    cells: Array<[number, number]>,
    free: boolean[][],
    rows: number,
    cols: number,
    cellSize: number,
): Point[] {
    const cols2 = cols + 1;
    const enc = (gr: number, gc: number) => gr * cols2 + gc;
    const edgeMap = new Map<number, number>();

    for (const [r, c] of cells) {
        const freeAbove = r === 0 || !!free[r - 1]![c];
        const freeBelow = r === rows - 1 || !!free[r + 1]![c];
        const freeLeft  = c === 0 || !!free[r]![c - 1];
        const freeRight = c === cols - 1 || !!free[r]![c + 1];

        if (freeAbove) edgeMap.set(enc(r,     c + 1), enc(r,     c    )); // top
        if (freeBelow) edgeMap.set(enc(r + 1, c    ), enc(r + 1, c + 1)); // bottom
        if (freeLeft)  edgeMap.set(enc(r,     c    ), enc(r + 1, c    )); // left
        if (freeRight) edgeMap.set(enc(r + 1, c + 1), enc(r,     c + 1)); // right
    }
    return walkEdgeChain(edgeMap, cols2, cellSize);
}

// ---------------------------------------------------------------------------
// Polygon: CW zone boundary tracing.
//
// "Outside" = off-grid OR a border-obstacle cell.
// Border-touching obstacles are absorbed: their inner faces become the zone
// boundary; no separate obstacle polygon is emitted for them.
//
// Directed edge rules (zone interior on RIGHT, Y down → CW = positive area):
//   Top    (outside above): enc(r,   c  ) → enc(r,   c+1)
//   Bottom (outside below): enc(r+1, c+1) → enc(r+1, c  )
//   Left   (outside left):  enc(r+1, c  ) → enc(r,   c  )
//   Right  (outside right): enc(r,   c+1) → enc(r+1, c+1)
// ---------------------------------------------------------------------------
function traceZonePolygon(
    borderObstacleSet: Set<number>,
    rows: number,
    cols: number,
    cellSize: number,
): Point[] {
    const cols2 = cols + 1;
    const enc = (gr: number, gc: number) => gr * cols2 + gc;

    const isOutside = (r: number, c: number) =>
        r < 0 || r >= rows || c < 0 || c >= cols || borderObstacleSet.has(r * cols + c);

    const edgeMap = new Map<number, number>();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (borderObstacleSet.has(r * cols + c)) continue;
            if (isOutside(r - 1, c)) edgeMap.set(enc(r,     c    ), enc(r,     c + 1)); // top
            if (isOutside(r + 1, c)) edgeMap.set(enc(r + 1, c + 1), enc(r + 1, c    )); // bottom
            if (isOutside(r, c - 1)) edgeMap.set(enc(r + 1, c    ), enc(r,     c    )); // left
            if (isOutside(r, c + 1)) edgeMap.set(enc(r,     c + 1), enc(r + 1, c + 1)); // right
        }
    }
    return walkEdgeChain(edgeMap, cols2, cellSize);
}

// ---------------------------------------------------------------------------
// Start-point selection: multi-source BFS distance-to-blocked.
//
// Sources = obstacle cells + all four grid border cells.
// The free cell with the maximum BFS distance is the deepest interior point —
// maximally far from obstacles, ideal as a robot start location.
// ---------------------------------------------------------------------------
function findStartPoint(
    free: boolean[][],
    rows: number,
    cols: number,
    cellSize: number,
): Point {
    const INF = rows * cols + 1;
    const dist = new Int32Array(rows * cols).fill(INF);
    const queue: number[] = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const isBorder = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
            if (!free[r]![c] || isBorder) {
                dist[r * cols + c] = 0;
                queue.push(r * cols + c);
            }
        }
    }

    let head = 0;
    while (head < queue.length) {
        const idx = queue[head++]!;
        const r = Math.floor(idx / cols), c = idx % cols;
        const d = dist[idx]!;
        for (const [dr, dc] of DIRS4) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const ni = nr * cols + nc;
                if (dist[ni] === INF) {
                    dist[ni] = d + 1;
                    queue.push(ni);
                }
            }
        }
    }

    let bestIdx = Math.floor(rows / 2) * cols + Math.floor(cols / 2);
    let maxDist = -1;
    for (let i = 0; i < dist.length; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        if (free[r]![c] && dist[i]! > maxDist) { maxDist = dist[i]!; bestIdx = i; }
    }

    const half = cellSize / 2;
    return { x: (bestIdx % cols) * cellSize + half, y: Math.floor(bestIdx / cols) * cellSize + half };
}

// ---------------------------------------------------------------------------
// Grid builder: growth-based clustering obstacle placement + stabilisation.
//
// clusteringFrac ∈ [0, 1]:
//   0 → every obstacle is an isolated single-cell seed (maximum spread).
//   1 → all obstacles expand from the first seed into one large blob.
//
// The start cell is always protected (always free after placement).
//
// Stabilisation loop:
//   1. closeDiagonals — eliminate zero-width corner gaps (runs to fixpoint internally).
//   2. BFS flood-fill — convert unreachable free cells to obstacles (isolated pockets).
//   Repeat until neither step makes any change.
// ---------------------------------------------------------------------------
function buildGrid(
    rows: number,
    cols: number,
    startC: number,
    startR: number,
    targetObstacles: number,
    clusteringFrac: number,
    seedNum: number,
): boolean[][] {
    const rand = mulberry32(seedNum);
    const free: boolean[][] = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(true));

    // Shuffled pool of all cell indices (except start cell) used as isolated seed candidates.
    const totalCells = rows * cols;
    const seedPool: number[] = [];
    for (let i = 0; i < totalCells; i++) {
        if (i !== startR * cols + startC) seedPool.push(i);
    }
    // Fisher-Yates shuffle — deterministic order from seedNum
    for (let i = seedPool.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const tmp = seedPool[i]!; seedPool[i] = seedPool[j]!; seedPool[j] = tmp;
    }

    // frontier: flat indices of obstacle cells that may still expand
    const frontier: number[] = [];
    let seedIdx = 0;
    let placed = 0;
    const target = Math.min(targetObstacles, totalCells - 1);

    const markObstacle = (r: number, c: number) => {
        free[r]![c] = false;
        placed++;
        frontier.push(r * cols + c);
    };

    // Expand a random frontier cell into a free neighbour. Lazily removes exhausted
    // frontier entries via swap-and-pop. Returns true when a cell was placed.
    const grow = (): boolean => {
        while (frontier.length > 0) {
            const fi = Math.floor(rand() * frontier.length);
            const idx = frontier[fi]!;
            const fr = Math.floor(idx / cols), fc = idx % cols;
            const nbrs: Array<[number, number]> = [];
            for (const [dr, dc] of DIRS4) {
                const nr = fr + dr, nc = fc + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && free[nr]![nc]) nbrs.push([nr, nc]);
            }
            if (nbrs.length === 0) {
                // Lazy remove: swap last → fi, pop
                frontier[fi] = frontier[frontier.length - 1]!;
                frontier.pop();
                continue;
            }
            const [nr, nc] = nbrs[Math.floor(rand() * nbrs.length)]!;
            markObstacle(nr, nc);
            return true;
        }
        return false;
    };

    // Place the next unused seed from the shuffled pool, skipping cells already
    // turned into obstacles. Returns true when a cell was placed.
    const plantSeed = (): boolean => {
        while (seedIdx < seedPool.length) {
            const idx = seedPool[seedIdx++]!;
            const r = Math.floor(idx / cols), c = idx % cols;
            if (free[r]![c]) { markObstacle(r, c); return true; }
        }
        return false;
    };

    while (placed < target) {
        if (rand() < clusteringFrac && frontier.length > 0) {
            // Prefer growth; fall back to seed if frontier is unexpectedly exhausted
            if (!grow() && !plantSeed()) break;
        } else {
            // Prefer new isolated seed; fall back to growth when pool is exhausted
            if (!plantSeed() && !grow()) break;
        }
    }

    // The start cell must always remain navigable
    free[startR]![startC] = true;

    // Stabilise until no more changes
    let anyChange = true;
    while (anyChange) {
        anyChange = closeDiagonals(free, rows, cols);
        const reachable = floodFill(free, rows, cols, startC, startR);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (free[r]![c] && !reachable[r * cols + c]) {
                    free[r]![c] = false;
                    anyChange = true;
                }
            }
        }
    }

    return free;
}

// ---------------------------------------------------------------------------
// generateEnvironment — public API
// ---------------------------------------------------------------------------

/**
 * Generates a rectangular environment with randomly placed obstacles for
 * coverage-planning simulations.
 *
 * Algorithm summary:
 *   1. Derive cell size from minPassageWidth (scaled up when grid would
 *      exceed MAX_GRID_CELLS for performance).
 *   2. Resolve seed, clustering, and obstacle-ratio values.
 *   3. Binary-search initial density to calibrate final obstacle ratio
 *      (since stabilisation always adds obstacles).
 *   4. Build grid with growth-based clustering obstacle placement.
 *   5. Classify obstacle components: border (absorbed into boundary) vs interior.
 *   6. Trace CW zone boundary (border obstacles absorbed as indentations).
 *   7. Trace CCW polygons for each interior obstacle component & pick start point.
 *
 * Never throws — returns empty arrays for invalid/degenerate inputs.
 */
export function generateEnvironment({
    width,
    height,
    minPassageWidth,
    obstacleRatio,
    clustering,
    seed,
}: GeneratorParams): GeneratedEnvironment {
    const EMPTY: GeneratedEnvironment = {
        boundary: [],
        obstacles: [],
        startEndPoint: { x: 0, y: 0 },
        usedClusteringPct: 0,
        usedObstacleRatioPct: 0,
        usedSeedHex: "0x00000000",
    };

    if (width <= 0 || height <= 0 || minPassageWidth <= 0) return EMPTY;

    // -------------------------------------------------------------------------
    // 1. Grid sizing: scale up cell size if the raw grid would exceed MAX_GRID_CELLS
    // -------------------------------------------------------------------------
    const rawCols = Math.floor(width / minPassageWidth);
    const rawRows = Math.floor(height / minPassageWidth);
    const rawCells = rawCols * rawRows;
    const scaleFactor = rawCells > MAX_GRID_CELLS ? Math.ceil(Math.sqrt(rawCells / MAX_GRID_CELLS)) : 1;
    const cellSize = minPassageWidth * scaleFactor;
    const cols = Math.max(2, Math.floor(width / cellSize));
    const rows = Math.max(2, Math.floor(height / cellSize));

    // -------------------------------------------------------------------------
    // 2. Resolve seed, clustering fraction, and target density
    // -------------------------------------------------------------------------
    const seedNum: number = seed.trim()
        ? hashSeed(seed.trim())
        : ((Date.now() ^ (Math.random() * 0x100000000 >>> 0)) >>> 0);

    // Clustering: explicit scalar, deterministic pick from range, or seed-derived
    const clusterRandDraw = mulberry32(seedNum)();
    const clusteringFrac =
        clustering === undefined
            ? clusterRandDraw
            : Array.isArray(clustering)
                ? Math.max(0, Math.min(1,
                    (Math.min(clustering[0], clustering[1]) +
                        clusterRandDraw * Math.abs(clustering[1] - clustering[0])) / 100))
                : Math.max(0, Math.min(1, clustering / 100));

    // Obstacle ratio: explicit scalar, deterministic pick from range, or seed-derived
    const obsRandDraw = mulberry32(seedNum ^ 0x9e3779b9)();
    const targetDensity =
        obstacleRatio === undefined
            ? (AUTO_RATIO_MIN + obsRandDraw * AUTO_RATIO_RANGE) / 100
            : Array.isArray(obstacleRatio)
                ? Math.max(0, Math.min(1,
                    (Math.min(obstacleRatio[0], obstacleRatio[1]) +
                        obsRandDraw * Math.abs(obstacleRatio[1] - obstacleRatio[0])) / 100))
                : Math.max(0, Math.min(1, obstacleRatio / 100));

    // -------------------------------------------------------------------------
    // 3. Calibrate initial density to hit the target final obstacle ratio.
    //
    //    Stabilisation (diagonal closure + BFS) only ever adds obstacles, so
    //    the final ratio is always ≥ the initial placement density. When the
    //    caller specifies obstacleRatio we binary-search the initial density
    //    whose stabilised result matches the requested final ratio exactly.
    //    (lo is chosen so finalDensity(lo) ≤ target, guaranteeing no overshoot.)
    // -------------------------------------------------------------------------
    const startC = Math.floor(cols / 2);
    const startR = Math.floor(rows / 2);

    let initialDensity = targetDensity;
    if (obstacleRatio !== undefined) {
        const targetObstacles = Math.round(rows * cols * targetDensity);
        // hi must be 1, not targetDensity: stabilisation always adds obstacles, so
        // finalDensity(d) >= d. Using hi=targetDensity as the upper bound causes
        // the first iteration to probe targetDensity/2, whose stabilised result
        // is well below target, and lo never reaches the correct initial density.
        let lo = 0, hi = 1;
        let lastLoObs = 0;   // stabilised obstacle count at the current lo boundary
        let lastHiObs = -1;  // stabilised obstacle count at the current hi boundary (-1 = uninitialised)
        for (let i = 0; i < 10; i++) {
            const mid = (lo + hi) / 2;
            const trialFree = buildGrid(rows, cols, startC, startR, Math.round(mid * rows * cols), clusteringFrac, seedNum);
            let obs = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (!trialFree[r]![c]) obs++;
                }
            }
            if (obs > targetObstacles) { hi = mid; lastHiObs = obs; }
            else { lo = mid; lastLoObs = obs; }
        }
        // Due to the percolation phase transition the stabilised obstacle count can jump from
        // ~40% to ~99% over a tiny initial-density range. When this happens lo (below the
        // jump) gives far fewer obstacles than requested while hi (above the jump) may overshoot
        // only slightly. Pick whichever boundary is closer to the target rather than always lo.
        if (lastHiObs < 0) {
            // Even density=1 cannot exceed the target — use the highest achievable density.
            initialDensity = lo;
        } else {
            initialDensity = (targetObstacles - lastLoObs) <= (lastHiObs - targetObstacles) ? lo : hi;
        }
    }

    // -------------------------------------------------------------------------
    // 4. Build and stabilise the grid with the calibrated initial density
    // -------------------------------------------------------------------------
    const free = buildGrid(
        rows, cols, startC, startR,
        Math.round(initialDensity * rows * cols),
        clusteringFrac,
        seedNum,
    );

    // -------------------------------------------------------------------------
    // 5. Classify obstacle components
    // -------------------------------------------------------------------------
    const components = findObstacleComponents(free, rows, cols);

    const borderObstacleSet = new Set<number>();
    for (const { cells, isBorder } of components) {
        if (isBorder) for (const [r, c] of cells) borderObstacleSet.add(r * cols + c);
    }

    // -------------------------------------------------------------------------
    // 6. Trace polygons
    // -------------------------------------------------------------------------
    const boundary = traceZonePolygon(borderObstacleSet, rows, cols, cellSize);

    const obstacles: Point[][] = components
        .filter(({ isBorder }) => !isBorder)
        .map(({ cells }) => traceObstaclePolygon(cells, free, rows, cols, cellSize));

    const startEndPoint = findStartPoint(free, rows, cols, cellSize);

    // -------------------------------------------------------------------------
    // 7. Return
    // -------------------------------------------------------------------------
    const usedSeedHex = `0x${seedNum.toString(16).toUpperCase().padStart(8, "0")}`;

    return {
        boundary,
        obstacles,
        startEndPoint,
        usedClusteringPct: Math.round(clusteringFrac * 100),
        usedObstacleRatioPct: Math.round(targetDensity * 100),
        usedSeedHex,
    };
}
