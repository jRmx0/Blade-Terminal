import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";

export interface GeneratorParams {
    width: number;
    height: number;
    minPassageWidth: number;
    /** Obstacle ratio as a percentage [0, 100], or a [min, max] range the generator
     * picks from randomly. When omitted the density is derived from the seed. */
    obstacleRatio?: number | [number, number];
    /** Clustering probability as a percentage [0, 100], or a [min, max] range the generator
     * picks from randomly.
     * 0  = every obstacle is an isolated single-cell seed (maximum spread).
     * 100 = all obstacles expand into one large connected blob (minimum spread).
     * When omitted a random value is derived deterministically from the seed. */
    clustering?: number | [number, number];
    seed: string;
}

export interface GeneratedEnvironment {
    boundary: Point[];
    obstacles: Point[][];
    startEndPoint: Point;
    /** Clustering percentage [0, 100] that was actually used during this generation.
     * Reflects the explicitly supplied value or the auto-derived random value when
     * `clustering` was omitted from GeneratorParams. */
    usedClusteringPct: number;
    /** Obstacle ratio percentage [0, 100] that was targeted during this generation.
     * Reflects the explicitly supplied value or the auto-derived random value when
     * `obstacleRatio` was omitted from GeneratorParams. */
    usedObstacleRatioPct: number;
    /** The value randomly picked from the range when `obstacleRatio` was supplied as [lo, hi],
     * or `null` when an explicit number (or auto) was used. Use this for displaying which
     * value was selected from the user's range — not the calibrated final ratio. */
    pickedObstacleRatioPct: number | null;
    /** The value randomly picked from the range when `clustering` was supplied as [lo, hi],
     * or `null` when an explicit number (or auto) was used. */
    pickedClusteringPct: number | null;
    /** The resolved 32-bit seed expressed as a hex literal (e.g. `0x8A3F1C2D`).
     * Paste this back into the seed field to reproduce the exact same environment. */
    usedSeedHex: string;
}

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
}

// FNV-1a 32-bit hash for seed strings.
// If the string starts with '0x' or '0X' it is treated as a hex literal and
// parsed directly so round-tripping a displayed seed produces identical output.
function hashSeed(s: string): number {
    if (/^0x[0-9a-f]+$/i.test(s.trim())) return (parseInt(s.trim(), 16)) >>> 0;
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------

const DIRS4: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/**
 * Fills one free cell for every 2×2 block where exactly two diagonally opposite
 * cells are obstacles. Such a block creates a zero-width corner gap between the
 * two obstacle rectangles, which would allow a path narrower than minPassageWidth.
 *
 * Runs until no such pattern remains (new obstacles can expose further patterns).
 */
function closeDiagonals(free: boolean[][], rows: number, cols: number): void {
    let changed = true;
    while (changed) {
        changed = false;
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const tl = !free[r]![c];
                const tr = !free[r]![c + 1];
                const bl = !free[r + 1]![c];
                const br = !free[r + 1]![c + 1];
                // TL+BR diagonal — fill TR to close the zero-width corner
                if (tl && br && !tr && !bl) { free[r]![c + 1] = false; changed = true; }
                // TR+BL diagonal — fill TL
                if (tr && bl && !tl && !br) { free[r]![c] = false; changed = true; }
            }
        }
    }
}

/** BFS flood-fill from (startC, startR). Returns reachable grid. */
function floodFill(
    free: boolean[][],
    rows: number,
    cols: number,
    startC: number,
    startR: number,
): boolean[][] {
    const reachable: boolean[][] = Array.from({ length: rows }, () =>
        new Array<boolean>(cols).fill(false),
    );
    reachable[startR]![startC] = true;
    const queue: [number, number][] = [[startC, startR]];
    let head = 0;
    while (head < queue.length) {
        const [c, r] = queue[head++]!;
        for (const [dc, dr] of DIRS4) {
            const nc = c + dc!, nr = r + dr!;
            if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && !reachable[nr]![nc] && free[nr]![nc]) {
                reachable[nr]![nc] = true;
                queue.push([nc, nr]);
            }
        }
    }
    return reachable;
}

/**
 * BFS to group all obstacle cells into connected components.
 * Also detects whether each component touches the grid border.
 */
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
            const queue: Array<[number, number]> = [[r, c]];
            visited[r * cols + c] = 1;
            let head = 0;
            while (head < queue.length) {
                const [cr, cc] = queue[head++]!;
                cells.push([cr, cc]);
                if (cr === 0 || cr === rows - 1 || cc === 0 || cc === cols - 1) isBorder = true;
                for (const [dr, dc] of DIRS4) {
                    const nr = cr + dr!, nc = cc + dc!;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
                        && !free[nr]![nc] && !visited[nr * cols + nc]) {
                        visited[nr * cols + nc] = 1;
                        queue.push([nr, nc]);
                    }
                }
            }
            components.push({ cells, isBorder });
        }
    }
    return components;
}

/**
 * Traces the boundary of a connected obstacle component into a CCW polygon
 * (screen coords, Y down → negative signed area = CCW = obstacle winding).
 *
 * For each obstacle cell, boundary edges facing free space are emitted as
 * directed half-edges oriented so the obstacle interior is on the LEFT:
 *   Top    (free above): (r,  c+1) → (r,  c )   right→left
 *   Bottom (free below): (r+1,c ) → (r+1,c+1)   left→right
 *   Left   (free left):  (r,  c ) → (r+1,c )    top→bottom
 *   Right  (free right): (r+1,c+1)→ (r,  c+1)   bottom→top
 *
 * Grid vertices [gr,gc] are encoded as integers; collinear vertices are
 * removed before converting grid coords to pixel coords.
 */
function traceComponentPolygon(
    cells: Array<[number, number]>,
    free: boolean[][],
    rows: number,
    cols: number,
    cellSize: number,
): Point[] {
    const cols2 = cols + 1; // grid-vertex columns per row
    const enc = (gr: number, gc: number) => gr * cols2 + gc;

    // directed edge map: encoded start vertex → encoded end vertex
    const edgeMap = new Map<number, number>();

    for (const [r, c] of cells) {
        const freeAbove = r === 0 || !!free[r - 1]![c];
        const freeBelow = r === rows - 1 || !!free[r + 1]![c];
        const freeLeft = c === 0 || !!free[r]![c - 1];
        const freeRight = c === cols - 1 || !!free[r]![c + 1];

        if (freeAbove) edgeMap.set(enc(r, c + 1), enc(r, c)); // top
        if (freeBelow) edgeMap.set(enc(r + 1, c), enc(r + 1, c + 1)); // bottom
        if (freeLeft) edgeMap.set(enc(r, c), enc(r + 1, c)); // left
        if (freeRight) edgeMap.set(enc(r + 1, c + 1), enc(r, c + 1)); // right
    }

    // Walk the closed chain
    const rawPolygon: Array<[number, number]> = [];
    const startEnc = edgeMap.keys().next().value!;
    let cur = startEnc;
    do {
        rawPolygon.push([Math.floor(cur / cols2), cur % cols2]);
        cur = edgeMap.get(cur)!;
        if (rawPolygon.length > edgeMap.size + 2) break; // safety guard
    } while (cur !== startEnc);

    // Remove collinear intermediate vertices, convert to pixel coords
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

/**
 * Traces the outer boundary of all non-border-obstacle cells as a CW zone polygon.
 * "Outside" for a zone cell face = off-grid or a border-obstacle cell.
 * Border-touching obstacles are absorbed: their shared face with the grid edge is
 * removed and their inward face becomes part of the zone boundary instead.
 *
 * CW directed edge rules (interior on RIGHT in screen coords, Y down):
 *   Top    outside: (r,  c  ) → (r,  c+1)
 *   Bottom outside: (r+1,c+1) → (r+1,c  )
 *   Left   outside: (r+1,c  ) → (r,  c  )
 *   Right  outside: (r,  c+1) → (r+1,c+1)
 */
function traceZonePolygon(
    borderObstacleSet: Set<number>,
    rows: number,
    cols: number,
    cellSize: number,
): Point[] {
    const cols2 = cols + 1;
    const enc = (gr: number, gc: number) => gr * cols2 + gc;

    const isOutside = (r: number, c: number): boolean =>
        r < 0 || r >= rows || c < 0 || c >= cols || borderObstacleSet.has(r * cols + c);

    const edgeMap = new Map<number, number>();

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (borderObstacleSet.has(r * cols + c)) continue;
            if (isOutside(r - 1, c)) edgeMap.set(enc(r, c), enc(r, c + 1)); // top
            if (isOutside(r + 1, c)) edgeMap.set(enc(r + 1, c + 1), enc(r + 1, c)); // bottom
            if (isOutside(r, c - 1)) edgeMap.set(enc(r + 1, c), enc(r, c)); // left
            if (isOutside(r, c + 1)) edgeMap.set(enc(r, c + 1), enc(r + 1, c + 1)); // right
        }
    }

    if (edgeMap.size === 0) return [];

    const rawPolygon: Array<[number, number]> = [];
    const startEnc = edgeMap.keys().next().value!;
    let cur = startEnc;
    do {
        rawPolygon.push([Math.floor(cur / cols2), cur % cols2]);
        cur = edgeMap.get(cur)!;
        if (rawPolygon.length > edgeMap.size + 2) break;
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

/**
 * Finds the best start and end points in the free space.
 *
 * "Best" = most free space around = furthest from any obstacle or grid border.
 *
 * Step 1: Multi-source BFS from every obstacle cell AND the four grid borders
 *         gives dist[r][c] = Manhattan-BFS distance to the nearest blocked cell.
 *         The free cell with the maximum dist is the start (deepest interior point).
 *
 * Returns the pixel-space center of the chosen cell.
 */
function findBestPoint(
    free: boolean[][],
    rows: number,
    cols: number,
    cellSize: number,
): Point {
    // --- Step 1: distance-to-obstacle BFS (sources = obstacle cells + border) ---
    const INF = rows * cols + 1;
    const dist = Array.from({ length: rows }, () => new Int32Array(cols).fill(INF));
    const queue: Array<[number, number]> = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const isBorder = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
            if (!free[r]![c] || isBorder) {
                dist[r]![c] = 0;
                queue.push([r, c]);
            }
        }
    }

    let head = 0;
    while (head < queue.length) {
        const [r, c] = queue[head++]!;
        for (const [dr, dc] of DIRS4) {
            const nr = r + dr!, nc = c + dc!;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr]![nc] === INF) {
                dist[nr]![nc] = dist[r]![c]! + 1;
                queue.push([nr, nc]);
            }
        }
    }

    // Free cell with max dist = best point
    let bestR = Math.floor(rows / 2), bestC = Math.floor(cols / 2);
    let maxDist = -1;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (free[r]![c] && dist[r]![c]! > maxDist) {
                maxDist = dist[r]![c]!;
                bestR = r; bestC = c;
            }
        }
    }

    const half = cellSize / 2;
    return { x: bestC * cellSize + half, y: bestR * cellSize + half };
}

// ---------------------------------------------------------------------------
// Generator helpers
// ---------------------------------------------------------------------------

/** Range for auto-generated obstacle ratio: [AUTO_RATIO_MIN, AUTO_RATIO_MIN + AUTO_RATIO_RANGE]% */
const AUTO_RATIO_MIN = 5;
const AUTO_RATIO_RANGE = 55; // → [5, 60]%

function pickWholeNumberInRange(draw: number, a: number, b: number): number {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const intLo = Math.ceil(lo);
    const intHi = Math.floor(hi);

    // Typical path (integer-capable interval): uniform inclusive integer pick.
    if (intLo <= intHi) {
        const span = intHi - intLo + 1;
        return intLo + Math.floor(draw * span);
    }

    // Degenerate decimal interval with no integer points: pick nearest integer deterministically.
    return Math.round(lo + draw * (hi - lo));
}

/**
 * Returns the obstacle ratio percentage that will be used for a given seed.
 *
 * When `range` is provided the return value is the deterministic pick from that
 * range. When omitted the auto range [5, 60]% is used.
 *
 * Returns `null` when `seed` is blank (value would change on every call because
 * seedNum falls back to Date.now()).
 */
/**
 * Returns the obstacle ratio percentage that will be used for a given seed.
 *
 * When `range` is provided, the return value is the deterministic pick from that
 * range. When omitted, the full auto range [5, 60]% is used.
 *
 * Returns `null` when `seed` is blank (preview would be non-deterministic).
 */
export function computeResolvedObstacleRatioPct(seed: string, range?: [number, number]): number | null {
    if (!seed.trim()) return null;
    const draw = mulberry32(hashSeed(seed.trim()) ^ 0x9e3779b9)();
    if (range !== undefined) {
        return pickWholeNumberInRange(draw, range[0], range[1]);
    }
    return pickWholeNumberInRange(draw, AUTO_RATIO_MIN, AUTO_RATIO_MIN + AUTO_RATIO_RANGE);
}

/**
 * Returns the clustering percentage that will be used for a given seed.
 *
 * When `range` is provided the return value is the deterministic pick from that
 * range. When omitted the full auto range [0, 100]% is used.
 *
 * Returns `null` when `seed` is blank (preview would be non-deterministic).
 */
export function computeResolvedClusteringPct(seed: string, range?: [number, number]): number | null {
    if (!seed.trim()) return null;
    const draw = mulberry32(hashSeed(seed.trim()))();
    if (range !== undefined) {
        return pickWholeNumberInRange(draw, range[0], range[1]);
    }
    return pickWholeNumberInRange(draw, 0, 100);
}

/**
 * Builds a grid by sequentially placing `targetObstacles` obstacle cells using
 * a growth-based clustering strategy, then stabilises the result.
 *
 * @param clusteringFrac  Probability [0, 1] that each placement EXPANDS an existing
 *                        obstacle cluster rather than starting a new isolated seed.
 *                        0 = all obstacles are isolated single-cell seeds.
 *                        1 = all obstacles grow into one large connected blob
 *                            (the first obstacle is always seeded since the frontier
 *                            starts empty).
 *
 * When the seed pool is exhausted the algorithm falls back to growth only,
 * so that the requested Obstacle Ratio is always honoured.
 *
 * Creating a fresh PRNG from `seedNum` each call ensures identical output
 * regardless of how many times this is invoked (used by the binary-search
 * calibration in generateEnvironment).
 */
function buildWithClustering(
    rows: number,
    cols: number,
    startC: number,
    startR: number,
    targetObstacles: number,
    clusteringFrac: number,
    seedNum: number,
): boolean[][] {
    const rand = mulberry32(seedNum);

    // All cells start free
    const free: boolean[][] = Array.from({ length: rows }, () =>
        new Array<boolean>(cols).fill(true),
    );

    // Shuffled pool of all cell indices (except start) used as isolated seed candidates.
    const totalCells = rows * cols;
    const seedPool: number[] = [];
    for (let i = 0; i < totalCells; i++) {
        if (i !== startR * cols + startC) seedPool.push(i);
    }
    // Fisher-Yates shuffle so each seed pops in a deterministic random order
    for (let i = seedPool.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const tmp = seedPool[i]!; seedPool[i] = seedPool[j]!; seedPool[j] = tmp;
    }

    // frontier: indices of obstacle cells that may still have free neighbours (lazily cleaned)
    const frontier: number[] = [];
    let seedIdx = 0;
    let placed = 0;
    const target = Math.min(targetObstacles, totalCells - 1);

    function markObstacle(r: number, c: number): void {
        free[r]![c] = false;
        placed++;
        frontier.push(r * cols + c);
    }

    /** Expands a random frontier cell into one of its free neighbours.
     *  Lazily removes exhausted frontier cells. Returns true if a cell was placed. */
    function grow(): boolean {
        while (frontier.length > 0) {
            const fi = Math.floor(rand() * frontier.length);
            const idx = frontier[fi]!;
            const fr = Math.floor(idx / cols), fc = idx % cols;
            const nbrs: Array<[number, number]> = [];
            for (const [dr, dc] of DIRS4) {
                const nr = fr + dr!, nc = fc + dc!;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && free[nr]![nc]) {
                    nbrs.push([nr, nc]);
                }
            }
            if (nbrs.length === 0) {
                // Lazy delete: swap-and-pop
                frontier[fi] = frontier[frontier.length - 1]!;
                frontier.pop();
                continue;
            }
            const [nr, nc] = nbrs[Math.floor(rand() * nbrs.length)]!;
            markObstacle(nr, nc);
            return true;
        }
        return false;
    }

    /** Places the next unused seed from the shuffled pool.
     *  Skips cells already turned into obstacles by a grow step.
     *  Returns true if a cell was placed. */
    function seed(): boolean {
        while (seedIdx < seedPool.length) {
            const idx = seedPool[seedIdx++]!;
            const r = Math.floor(idx / cols), c = idx % cols;
            if (free[r]![c]) {
                markObstacle(r, c);
                return true;
            }
        }
        return false;
    }

    while (placed < target) {
        if (rand() < clusteringFrac && frontier.length > 0) {
            // Prefer growth; fall back to seed if frontier is unexpectedly exhausted
            if (!grow() && !seed()) break;
        } else {
            // Prefer new isolated seed; fall back to growth when pool is exhausted
            // (fallback ensures Obstacle Ratio is honoured even at high densities)
            if (!seed() && !grow()) break;
        }
    }

    // Ensure the start cell is always accessible
    free[startR]![startC] = true;

    // Stabilise: diagonal closure + BFS flood-fill
    for (let pass = 0; pass < 10; pass++) {
        closeDiagonals(free, rows, cols);
        const reachable = floodFill(free, rows, cols, startC, startR);
        let anyIsolated = false;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (free[r]![c] && !reachable[r]![c]) {
                    free[r]![c] = false;
                    anyIsolated = true;
                }
            }
        }
        if (!anyIsolated) break;
    }
    return free;
}

/** Maximum grid cells to prevent performance issues on large / fine-grained inputs. */
const MAX_GRID_CELLS = 40_000;

/**
 * Generates a rectangular environment filled with randomly placed obstacle blocks.
 *
 * Algorithm:
 * 1. Build a grid of cells — cell size = minPassageWidth (scaled up if grid would exceed MAX_GRID_CELLS).
 * 2. Randomly mark cells as obstacles using the seeded PRNG at the given ratio
 * 3. Iteratively:
 *    a. closeDiagonals — for every 2×2 block where two diagonally opposite cells are
 *       obstacles, fill one free cell so no zero-width corner gap exists. Repeat until stable.
 *    b. BFS flood-fill from the grid center — convert any unreachable free cell to an obstacle,
 *       eliminating isolated pockets. New obstacles may create new diagonal patterns → loop.
 * 4. Classify obstacle components as border (touching the grid edge) or interior.
 *    Border components are absorbed into the zone boundary — their shared edges
 *    with the grid perimeter are removed and their inward faces become the zone border.
 * 5. Trace the zone polygon (CW) as the boundary of all non-border-obstacle cells.
 * 6. Trace interior obstacle polygons (CCW) for each interior component.
 */
export function generateEnvironment({ width, height, minPassageWidth, obstacleRatio, clustering, seed }: GeneratorParams): GeneratedEnvironment {
    if (width <= 0 || height <= 0 || minPassageWidth <= 0) {
        return { boundary: [], obstacles: [], startEndPoint: { x: 0, y: 0 }, usedClusteringPct: 0, usedObstacleRatioPct: 0, pickedObstacleRatioPct: null, pickedClusteringPct: null, usedSeedHex: "0x00000000" };
    }

    // Scale up cell size if the raw grid would exceed the cell cap
    const rawCols = Math.floor(width / minPassageWidth);
    const rawRows = Math.floor(height / minPassageWidth);
    const rawCells = rawCols * rawRows;
    const scaleFactor = rawCells > MAX_GRID_CELLS ? Math.ceil(Math.sqrt(rawCells / MAX_GRID_CELLS)) : 1;
    const cellSize = minPassageWidth * scaleFactor;

    const cols = Math.max(2, Math.floor(width / cellSize));
    const rows = Math.max(2, Math.floor(height / cellSize));
    const boundaryWidth = cols * cellSize;
    const boundaryHeight = rows * cellSize;

    const seedNum = seed.trim()
        ? hashSeed(seed.trim())
        : ((Date.now() ^ (Math.random() * 0x100000000 >>> 0)) >>> 0);

    // Clustering: resolved from explicit value, range, or seed-derived random draw
    const clusterRandDraw = mulberry32(seedNum)();
    const resolvedClusteringPct = clustering === undefined
        ? pickWholeNumberInRange(clusterRandDraw, 0, 100)
        : Array.isArray(clustering)
            ? pickWholeNumberInRange(clusterRandDraw, clustering[0], clustering[1])
            : Math.max(0, Math.min(100, clustering));
    const pickedClusteringPct = Array.isArray(clustering) ? resolvedClusteringPct : null;
    const clusteringFrac = Math.max(0, Math.min(1, resolvedClusteringPct / 100));

    const startC = Math.floor(cols / 2);
    const startR = Math.floor(rows / 2);

    // Obstacle ratio: resolved from explicit value, range, or seed-derived random draw
    const obsRandDraw = mulberry32(seedNum ^ 0x9e3779b9)();
    const resolvedTargetRatioPct = obstacleRatio === undefined
        ? pickWholeNumberInRange(obsRandDraw, AUTO_RATIO_MIN, AUTO_RATIO_MIN + AUTO_RATIO_RANGE)
        : Array.isArray(obstacleRatio)
            ? pickWholeNumberInRange(obsRandDraw, obstacleRatio[0], obstacleRatio[1])
            : Math.max(0, Math.min(100, obstacleRatio));
    const pickedObstacleRatioPct = Array.isArray(obstacleRatio) ? resolvedTargetRatioPct : null;
    const targetDensity = Math.max(0, Math.min(1, resolvedTargetRatioPct / 100));

    // -----------------------------------------------------------------------
    // 1. Calibrate initial density to hit the target FINAL obstacle ratio.
    //
    //    Stabilisation (diagonal closure + BFS) only ever adds obstacles, so
    //    the final ratio is always ≥ the initial placement density.  When the
    //    caller specifies obstacleRatio we binary-search the initial density
    //    whose stabilised result matches the requested final ratio exactly.
    //    (lo is chosen so finalDensity(lo) ≤ target, guaranteeing no overshoot.)
    // -----------------------------------------------------------------------
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
            const trialFree = buildWithClustering(rows, cols, startC, startR, Math.round(mid * rows * cols), clusteringFrac, seedNum);
            let obs = 0;
            for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols; c++)
                    if (!trialFree[r]![c]) obs++;
            if (obs > targetObstacles) { hi = mid; lastHiObs = obs; }
            else { lo = mid; lastLoObs = obs; }
        }
        // Due to the percolation phase transition the stabilised obstacle count can jump from
        // ~40 % to ~99 % over a tiny initial-density range. When this happens lo (below the
        // jump) gives far fewer obstacles than requested while hi (above the jump) may overshoot
        // only slightly. Pick whichever boundary is closer to the target rather than always lo.
        if (lastHiObs < 0) {
            // Even density=1 cannot exceed the target — use the highest achievable density.
            initialDensity = lo;
        } else {
            initialDensity = (targetObstacles - lastLoObs) <= (lastHiObs - targetObstacles) ? lo : hi;
        }
    }

    // -----------------------------------------------------------------------
    // 2. Generate the final stabilised grid with the calibrated initial density.
    // -----------------------------------------------------------------------
    const free = buildWithClustering(rows, cols, startC, startR, Math.round(initialDensity * rows * cols), clusteringFrac, seedNum);

    // -----------------------------------------------------------------------
    // 3. Find obstacle components; classify border vs. interior
    // -----------------------------------------------------------------------
    const components = findObstacleComponents(free, rows, cols);

    const borderObstacleSet = new Set<number>();
    for (const { cells, isBorder } of components) {
        if (isBorder) {
            for (const [r, c] of cells) borderObstacleSet.add(r * cols + c);
        }
    }

    // -----------------------------------------------------------------------
    // 4. Trace zone polygon — CW boundary of non-border-obstacle cells.
    //    Border-touching obstacles are absorbed: their inner face becomes the
    //    zone border; no separate obstacle polygon is emitted for them.
    // -----------------------------------------------------------------------
    const boundary = traceZonePolygon(borderObstacleSet, rows, cols, cellSize);

    // -----------------------------------------------------------------------
    // 5. Trace interior obstacle polygons (CCW)
    // -----------------------------------------------------------------------
    const obstacles: Point[][] = components
        .filter(({ isBorder }) => !isBorder)
        .map(({ cells }) => traceComponentPolygon(cells, free, rows, cols, cellSize));

    const startEndPoint = findBestPoint(free, rows, cols, cellSize);

    let finalObstacleCount = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!free[r]![c]) finalObstacleCount++;
        }
    }
    const usedObstacleRatioPct = Math.round((finalObstacleCount / (rows * cols)) * 100);

    const usedSeedHex = `0x${seedNum.toString(16).toUpperCase().padStart(8, "0")}`;
    return { boundary, obstacles, startEndPoint, usedClusteringPct: Math.round(clusteringFrac * 100), usedObstacleRatioPct, pickedObstacleRatioPct, pickedClusteringPct, usedSeedHex };
}
