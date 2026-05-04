/**
 * Geographic projection utilities for canvas ↔ Web-Mercator ↔ tile-coordinate
 * transforms used by the satellite map tile layer.
 *
 * All Web-Mercator values are in metres referenced to the standard EPSG:3857
 * extent (±20 037 508.34 m in both axes).
 *
 * Tile coordinates follow the standard XYZ (slippy-map) scheme where (0,0) is
 * the top-left (north-west) corner of the world at each zoom level and Y
 * increases southward.
 */

/** Circumference of the Earth along the equator in Web-Mercator metres. */
const EARTH_CIRC = 20_037_508.342_789_244;

/** Side length of an ArcGIS World Imagery tile in pixels. */
export const TILE_SIZE = 256;

// ── WGS-84 ↔ Web-Mercator ────────────────────────────────────────────────────

/** Convert a WGS-84 longitude (degrees) to a Web-Mercator X (metres). */
export function lonToMercX(lon: number): number {
    return (lon / 180) * EARTH_CIRC;
}

/** Convert a WGS-84 latitude (degrees) to a Web-Mercator Y (metres). */
export function latToMercY(lat: number): number {
    const rad = (lat * Math.PI) / 180;
    return Math.log(Math.tan(Math.PI / 4 + rad / 2)) * (EARTH_CIRC / Math.PI);
}

// ── Web-Mercator ↔ tile coordinates ─────────────────────────────────────────

/**
 * Number of metres covered by the full world at a given zoom level.
 * Identical in X and Y (the world is square in Web-Mercator).
 */
function worldMetres(zoom: number): number {
    return (EARTH_CIRC * 2) / Math.pow(2, zoom);
}

/** Convert a Web-Mercator X (metres) to a fractional tile column at `zoom`. */
export function mercXToTileX(mx: number, zoom: number): number {
    return (mx + EARTH_CIRC) / worldMetres(zoom);
}

/** Convert a Web-Mercator Y (metres) to a fractional tile row at `zoom`. */
export function mercYToTileY(my: number, zoom: number): number {
    return (EARTH_CIRC - my) / worldMetres(zoom);
}

/** Web-Mercator X of the left edge of tile column `tx` at `zoom`. */
export function tileXToMercX(tx: number, zoom: number): number {
    return tx * worldMetres(zoom) - EARTH_CIRC;
}

/** Web-Mercator Y of the top edge of tile row `ty` at `zoom`. */
export function tileYToMercY(ty: number, zoom: number): number {
    return EARTH_CIRC - ty * worldMetres(zoom);
}

// ── Zoom selection ───────────────────────────────────────────────────────────

/**
 * Choose the integer tile zoom level that best matches the current canvas
 * zoom and geographic scale.
 *
 * @param scale         Current canvas scale factor (screen pixels per canvas unit).
 * @param metersPerUnit Metres represented by one canvas unit.
 * @returns             Integer zoom in [0, 22].
 */
export function selectTileZoom(scale: number, metersPerUnit: number): number {
    // At zoom Z, one tile pixel covers: (2 * EARTH_CIRC) / (TILE_SIZE * 2^Z) metres.
    // We want that to equal metersPerUnit / scale (metres per screen pixel).
    // → 2^Z = (2 * EARTH_CIRC * scale) / (TILE_SIZE * metersPerUnit)
    const z = Math.log2((EARTH_CIRC * 2 * scale) / (TILE_SIZE * metersPerUnit));
    // Floor so we always pick the coarser zoom — better global coverage and fewer missing tiles.
    return Math.min(22, Math.max(0, Math.floor(z)));
}

// ── Canvas ↔ screen via geo-anchor ──────────────────────────────────────────

export interface GeoAnchorMerc {
    anchorMx: number;
    anchorMy: number;
    metersPerUnit: number;
}

/**
 * Convert a canvas world point (cx, cy) to Web-Mercator metres.
 *
 * The geo-anchor maps canvas origin (0, 0) to a specific Web-Mercator
 * coordinate. Canvas Y increases downward (screen convention), Web-Mercator Y
 * increases upward (geographic convention) — so cy is negated.
 */
export function canvasToMerc(
    cx: number,
    cy: number,
    { anchorMx, anchorMy, metersPerUnit }: GeoAnchorMerc,
): { mx: number; my: number } {
    return {
        mx: anchorMx + cx * metersPerUnit,
        my: anchorMy - cy * metersPerUnit,
    };
}

/**
 * Convert a Web-Mercator point (mx, my) to a canvas world point (cx, cy).
 */
export function mercToCanvas(
    mx: number,
    my: number,
    { anchorMx, anchorMy, metersPerUnit }: GeoAnchorMerc,
): { cx: number; cy: number } {
    return {
        cx: (mx - anchorMx) / metersPerUnit,
        cy: -(my - anchorMy) / metersPerUnit,
    };
}
