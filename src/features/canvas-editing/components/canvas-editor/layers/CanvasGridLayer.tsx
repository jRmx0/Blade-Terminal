import { Layer, Line } from "react-konva";
import { GRID_SPACING } from "@/config/canvas-editing/canvasConfig";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID } from "@/config/layers/layerRegistry";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";

interface CanvasGridLayerProps {
    position: Point;
    scale: number;
    size: { width: number; height: number };
}

export function CanvasGridLayer({ position, scale, size }: CanvasGridLayerProps) {
    const layers = useLayerSettingsStore((s) => s.layers);
    const strokeColor = getLayerParam(layers, LAYER_ID.GRID, "Grid Line Color") ?? "#e2e8f0";

    if (size.width === 0) return null;

    const worldLeft = -position.x / scale;
    const worldTop = -position.y / scale;
    const worldRight = (size.width - position.x) / scale;
    const worldBottom = (size.height - position.y) / scale;

    const startX = Math.floor(worldLeft / GRID_SPACING) * GRID_SPACING;
    const startY = Math.floor(worldTop / GRID_SPACING) * GRID_SPACING;

    const lines = [];
    for (let x = startX; x <= worldRight + GRID_SPACING; x += GRID_SPACING) {
        lines.push(
            <Line
                key={`vertical-grid-line-${x}`}
                points={[x, worldTop - GRID_SPACING, x, worldBottom + GRID_SPACING]}
                stroke={strokeColor}
                strokeWidth={1 / scale}
                listening={false}
            />,
        );
    }
    for (let y = startY; y <= worldBottom + GRID_SPACING; y += GRID_SPACING) {
        lines.push(
            <Line
                key={`horizontal-grid-line-${y}`}
                points={[worldLeft - GRID_SPACING, y, worldRight + GRID_SPACING, y]}
                stroke={strokeColor}
                strokeWidth={1 / scale}
                listening={false}
            />,
        );
    }

    return <Layer listening={false}>{lines}</Layer>;
}
