import { memo, useMemo, useRef } from "react";
import { Layer, Line, Rect } from "react-konva";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID, LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useParameterValuesStore } from "@/stores/parameterValuesStore";
import { buildCoverageVisitMap, resolvePathWidth, stripHexAlpha } from "@/utils/coverageGrid";

// ─── Component ───────────────────────────────────────────────────────────────

interface CanvasCoverageGridLayerProps {
    width: number;
    height: number;
}

function _CanvasCoverageGridLayer({ width, height }: CanvasCoverageGridLayerProps) {
    const layers = useLayerSettingsStore((s) => s.layers);
    const result = useComputeResultStore((s) => s.result);
    const catalogParams = useComputationCatalogStore((s) => s.parameters);
    const parameterValues = useParameterValuesStore((s) => s.parameterValues);

    // Refs keep the latest catalog/param values available without triggering recalc.
    // Coverage cells must reflect the segments from the last run, not the current slider value.
    const catalogParamsRef = useRef(catalogParams);
    catalogParamsRef.current = catalogParams;
    const parameterValuesRef = useRef(parameterValues);
    parameterValuesRef.current = parameterValues;

    const coverageLayer = layers.find(
        (l) => l.layer.id === LAYER_ID.COVERAGE_GRID && l.layer.algorithmId === 0 && l.layer.providerId === 0,
    );
    const coverageSettings = coverageLayer?.settings ?? [];
    const hasHydratedSettings = [
        LAYER_PARAM_KEY.VISIBLE,
        LAYER_PARAM_KEY.COVERAGE_GRID_CELL_SIZE,
        LAYER_PARAM_KEY.COVERAGE_GRID_LINE_COLOR,
        LAYER_PARAM_KEY.COVERAGE_GRID_LINE_WIDTH,
        LAYER_PARAM_KEY.COVERAGE_GRID_FILL_COLOR,
    ].every((key) => coverageSettings.some((p) => p.key === key));

    const visible = getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.VISIBLE) !== "false";
    const showGrid = getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_SHOW_GRID) !== "false";
    const strokeColor = getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_LINE_COLOR) ?? "#062e41";
    const strokeWidthRaw = parseFloat(
        getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_LINE_WIDTH) ?? "1",
    );
    const fillColorRaw = getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_FILL_COLOR) ?? "#0ea5e9";
    const cellSizeRaw = parseFloat(
        getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_CELL_SIZE) ?? "1",
    );

    const position = useCanvasViewStore((s) => s.position);
    const scale = useCanvasViewStore((s) => s.scale);

    const cellWorld = Number.isFinite(cellSizeRaw) && cellSizeRaw > 0 ? cellSizeRaw : 1;
    const lineWorld = Number.isFinite(strokeWidthRaw) && strokeWidthRaw > 0 ? strokeWidthRaw : 1;
    const sw = lineWorld / scale;
    const fillColor = stripHexAlpha(fillColorRaw);

    // ── Resolve path width from parameter values ──────────────────────────────
    // Deps: only result + cellWorld. catalogParams/parameterValues are read via
    // refs so slider edits before re-running the algorithm don't cause recalc.
    const pathWidth = useMemo(
        () => resolvePathWidth({ result, catalogParams: catalogParamsRef.current, parameterValues: parameterValuesRef.current, fallback: cellWorld }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [result, cellWorld],
    );

    // ── Build visit count map ─────────────────────────────────────────────────
    const coverageMap = useMemo(
        () =>
            hasHydratedSettings
                ? buildCoverageVisitMap({ segments: result?.result.coveragePathPlan.segments ?? [], cellSize: cellWorld, pathWidth })
                : { visitMap: new Map<string, number>(), maxCount: 0 },
        [hasHydratedSettings, result, cellWorld, pathWidth],
    );
    const visitMap = coverageMap.visitMap;
    const maxCount = coverageMap.maxCount;

    // Keep hook order stable across renders; gate paint after hooks run.
    if (!hasHydratedSettings || !visible) return null;

    // ── Viewport in world coordinates ─────────────────────────────────────────
    const minX = -position.x / scale;
    const maxX = (-position.x + width) / scale;
    const minY = -position.y / scale;
    const maxY = (-position.y + height) / scale;

    // ── Collect visible filled cells ──────────────────────────────────────────
    const visMinCol = Math.floor(minX / cellWorld) - 1;
    const visMaxCol = Math.floor(maxX / cellWorld) + 1;
    const visMinRow = Math.floor(minY / cellWorld) - 1;
    const visMaxRow = Math.floor(maxY / cellWorld) + 1;

    const filledCells: { key: string; col: number; row: number; opacity: number }[] = [];
    if (maxCount > 0) {
        for (const [key, count] of visitMap) {
            const commaIdx = key.indexOf(",");
            const col = parseInt(key.slice(0, commaIdx), 10);
            const row = parseInt(key.slice(commaIdx + 1), 10);
            if (col >= visMinCol && col <= visMaxCol && row >= visMinRow && row <= visMaxRow) {
                filledCells.push({ key, col, row, opacity: count / maxCount });
            }
        }
    }

    // ── Grid lines ────────────────────────────────────────────────────────────
    const firstVX = Math.floor(minX / cellWorld) * cellWorld;
    const firstHY = Math.floor(minY / cellWorld) * cellWorld;
    const vLines: number[] = [];
    const hLines: number[] = [];
    if (showGrid) {
        for (let x = firstVX; x <= maxX + cellWorld; x += cellWorld) vLines.push(x);
        for (let y = firstHY; y <= maxY + cellWorld; y += cellWorld) hLines.push(y);
    }

    return (
        <Layer listening={false}>
            {/* Cell fills */}
            {filledCells.map(({ key, col, row, opacity }) => (
                <Rect
                    key={key}
                    x={col * cellWorld}
                    y={row * cellWorld}
                    width={cellWorld}
                    height={cellWorld}
                    fill={fillColor}
                    opacity={opacity}
                    perfectDrawEnabled={false}
                />
            ))}
            {/* Grid lines */}
            {vLines.map((x) => (
                <Line
                    key={`v${x}`}
                    points={[x, minY, x, maxY]}
                    stroke={strokeColor}
                    strokeWidth={sw}
                    perfectDrawEnabled={false}
                />
            ))}
            {hLines.map((y) => (
                <Line
                    key={`h${y}`}
                    points={[minX, y, maxX, y]}
                    stroke={strokeColor}
                    strokeWidth={sw}
                    perfectDrawEnabled={false}
                />
            ))}
        </Layer>
    );
}

export const CanvasCoverageGridLayer = memo(_CanvasCoverageGridLayer);
