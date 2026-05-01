import { memo } from "react";
import { Layer, Line } from "react-konva";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID, LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";

interface CanvasCoverageGridLayerProps {
    width: number;
    height: number;
}

function _CanvasCoverageGridLayer({ width, height }: CanvasCoverageGridLayerProps) {
    const layers = useLayerSettingsStore((s) => s.layers);
    const visible = getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.VISIBLE) !== "false";
    const strokeColor = getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_LINE_COLOR) ?? "#0ea5e9";
    const strokeWidthRaw = parseFloat(
        getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_LINE_WIDTH) ?? "1",
    );
    // Reserved for future filled-cell mode. Kept as a persisted style param now.
    void getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_FILL_COLOR);
    const cellSizeRaw = parseFloat(
        getLayerParam(layers, LAYER_ID.COVERAGE_GRID, LAYER_PARAM_KEY.COVERAGE_GRID_CELL_SIZE) ?? "15",
    );

    const position = useCanvasViewStore((s) => s.position);
    const scale = useCanvasViewStore((s) => s.scale);

    if (!visible) return null;

    const cellWorld = Number.isFinite(cellSizeRaw) && cellSizeRaw > 0 ? cellSizeRaw : 15;
    const lineWorld = Number.isFinite(strokeWidthRaw) && strokeWidthRaw > 0 ? strokeWidthRaw : 1;
    const sw = lineWorld / scale;

    const minX = -position.x / scale;
    const maxX = (-position.x + width) / scale;
    const minY = -position.y / scale;
    const maxY = (-position.y + height) / scale;

    const firstVX = Math.floor(minX / cellWorld) * cellWorld;
    const firstHY = Math.floor(minY / cellWorld) * cellWorld;

    const vLines: number[] = [];
    for (let x = firstVX; x <= maxX + cellWorld; x += cellWorld) vLines.push(x);

    const hLines: number[] = [];
    for (let y = firstHY; y <= maxY + cellWorld; y += cellWorld) hLines.push(y);

    return (
        <Layer listening={false}>
            {vLines.map((x) => (
                <Line
                    key={x}
                    points={[x, minY, x, maxY]}
                    stroke={strokeColor}
                    strokeWidth={sw}
                    perfectDrawEnabled={false}
                />
            ))}
            {hLines.map((y) => (
                <Line
                    key={y}
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
