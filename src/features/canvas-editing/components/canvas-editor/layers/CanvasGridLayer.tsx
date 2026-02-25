import { Layer, Line } from "react-konva";
import { GRID_SPACING, COLOR_GRID } from "@/config/canvas-editing/canvasConfig";

interface CanvasGridLayerProps {
    position: { x: number; y: number };
    scale: number;
    size: { width: number; height: number };
}

export function CanvasGridLayer({ position, scale, size }: CanvasGridLayerProps) {
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
                stroke={COLOR_GRID}
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
                stroke={COLOR_GRID}
                strokeWidth={1 / scale}
                listening={false}
            />,
        );
    }

    return <Layer listening={false}>{lines}</Layer>;
}
