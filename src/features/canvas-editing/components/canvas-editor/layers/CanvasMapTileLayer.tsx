import { memo, useMemo } from "react";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import { useEnvStore } from "@/stores/envStore";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID, LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
import {
    lonToMercX,
    latToMercY,
    selectTileZoom,
    mercXToTileX,
    mercYToTileY,
    tileXToMercX,
    tileYToMercY,
    mercToCanvas,
} from "@/utils/geoProjection";
import type { GeoAnchorMerc } from "@/utils/geoProjection";

/** How many extra tile rows/columns to load beyond the visible edge. */
const TILE_BUFFER = 1;

/**
 * ArcGIS World Imagery tile URL.
 * No API key required; attribution to Esri et al. must be shown in production.
 * Note: ArcGIS uses z/y/x order (row before column), unlike the standard z/x/y.
 */
function arcgisTileUrl(z: number, x: number, y: number): string {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}

interface TileEntry {
    key: string;
    url: string;
    /** Left edge in screen pixels. */
    screenX: number;
    /** Top edge in screen pixels. */
    screenY: number;
    /** Tile side length in screen pixels. */
    screenSize: number;
}

function _CanvasMapTileLayer() {
    const layers = useLayerSettingsStore((s) => s.layers);
    const visible = getLayerParam(layers, LAYER_ID.SATELLITE_MAP, LAYER_PARAM_KEY.VISIBLE) !== "false";
    const opacityStr = getLayerParam(layers, LAYER_ID.SATELLITE_MAP, LAYER_PARAM_KEY.MAP_OPACITY);
    const opacity = Math.min(100, Math.max(0, Number(opacityStr ?? "100"))) / 100;

    const geoAnchor = useEnvStore((s) => s.env.geoAnchor);

    const position = useCanvasViewStore((s) => s.position);
    const scale = useCanvasViewStore((s) => s.scale);
    const canvasSize = useCanvasViewStore((s) => s.canvasSize);

    const tiles = useMemo<TileEntry[]>(() => {
        if (!visible || !geoAnchor) return [];

        const { width, height } = canvasSize;
        if (width <= 0 || height <= 0) return [];

        const anchorMerc: GeoAnchorMerc = {
            anchorMx: lonToMercX(geoAnchor.lon),
            anchorMy: latToMercY(geoAnchor.lat),
            metersPerUnit: geoAnchor.metersPerUnit,
        };

        const zoom = selectTileZoom(scale, geoAnchor.metersPerUnit);

        // Viewport bounds in canvas world coordinates
        const worldMinX = -position.x / scale;
        const worldMaxX = (width - position.x) / scale;
        const worldMinY = -position.y / scale;
        const worldMaxY = (height - position.y) / scale;

        // Canvas world corners → Web Mercator
        const { mx: mxMin, my: myMax } = { mx: anchorMerc.anchorMx + worldMinX * geoAnchor.metersPerUnit, my: anchorMerc.anchorMy - worldMinY * geoAnchor.metersPerUnit };
        const { mx: mxMax, my: myMin } = { mx: anchorMerc.anchorMx + worldMaxX * geoAnchor.metersPerUnit, my: anchorMerc.anchorMy - worldMaxY * geoAnchor.metersPerUnit };

        // Tile range
        const tileXMin = Math.floor(mercXToTileX(mxMin, zoom)) - TILE_BUFFER;
        const tileXMax = Math.floor(mercXToTileX(mxMax, zoom)) + TILE_BUFFER;
        const tileYMin = Math.floor(mercYToTileY(myMax, zoom)) - TILE_BUFFER;
        const tileYMax = Math.floor(mercYToTileY(myMin, zoom)) + TILE_BUFFER;

        const maxTileIndex = Math.pow(2, zoom) - 1;

        // Screen size of one tile
        const tileMeters = (2 * 20_037_508.342_789_244) / Math.pow(2, zoom);
        const tileWorld = tileMeters / geoAnchor.metersPerUnit;
        const tilePx = tileWorld * scale;

        const result: TileEntry[] = [];

        for (let ty = tileYMin; ty <= tileYMax; ty++) {
            if (ty < 0 || ty > maxTileIndex) continue;
            for (let tx = tileXMin; tx <= tileXMax; tx++) {
                if (tx < 0 || tx > maxTileIndex) continue;

                // Top-left Web-Mercator corner of this tile
                const mx_tl = tileXToMercX(tx, zoom);
                const my_tl = tileYToMercY(ty, zoom);

                // Convert to canvas world coordinates
                const { cx, cy } = mercToCanvas(mx_tl, my_tl, anchorMerc);

                // Convert to screen coordinates
                const screenX = cx * scale + position.x;
                const screenY = cy * scale + position.y;

                result.push({
                    key: `${zoom}/${tx}/${ty}`,
                    url: arcgisTileUrl(zoom, tx, ty),
                    screenX,
                    screenY,
                    screenSize: tilePx,
                });
            }
        }

        return result;
    }, [visible, geoAnchor, position, scale, canvasSize]);

    if (!visible || !geoAnchor || tiles.length === 0) return null;

    return (
        <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ opacity }}
        >
            {tiles.map((tile) => (
                <img
                    key={tile.key}
                    src={tile.url}
                    alt=""
                    decoding="async"
                    draggable={false}
                    style={{
                        position: "absolute",
                        left: tile.screenX,
                        top: tile.screenY,
                        width: tile.screenSize,
                        height: tile.screenSize,
                        imageRendering: "pixelated",
                        userSelect: "none",
                    }}
                />
            ))}
        </div>
    );
}

export const CanvasMapTileLayer = memo(_CanvasMapTileLayer);
