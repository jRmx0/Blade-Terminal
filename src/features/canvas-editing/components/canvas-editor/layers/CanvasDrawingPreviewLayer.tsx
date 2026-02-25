import { Layer, Line, Circle } from "react-konva";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";
import {
    COLOR_ZONE_STROKE,
    COLOR_OBSTACLE_STROKE,
    COLOR_DRAWING_PREVIEW_ZONE_EDGE,
    COLOR_DRAWING_PREVIEW_OBSTACLE_EDGE,
} from "@/config/canvas-editing/canvasConfig";

interface CanvasDrawingPreviewLayerProps {
    activeTool: ActiveTool | null;
    drawingPoints: { x: number; y: number }[];
    mousePos: { x: number; y: number } | null;
    scale: number;
}

export function CanvasDrawingPreviewLayer({
    activeTool,
    drawingPoints,
    mousePos,
    scale,
}: CanvasDrawingPreviewLayerProps) {
    const isDrawing = activeTool === "addZone" || activeTool === "addObstacle";

    if (!isDrawing || drawingPoints.length === 0) return null;

    const drawColor = activeTool === "addZone" ? COLOR_ZONE_STROKE : COLOR_OBSTACLE_STROKE;
    const previewEdgeColor =
        activeTool === "addZone" ? COLOR_DRAWING_PREVIEW_ZONE_EDGE : COLOR_DRAWING_PREVIEW_OBSTACLE_EDGE;
    const lastPoint = drawingPoints[drawingPoints.length - 1];

    return (
        <Layer listening={false}>
            <Line
                points={drawingPoints.flatMap((p) => [p.x, p.y])}
                stroke={drawColor}
                strokeWidth={2 / scale}
                closed={false}
                dash={[6 / scale, 3 / scale]}
            />
            {mousePos && lastPoint && (
                <Line
                    points={[lastPoint.x, lastPoint.y, mousePos.x, mousePos.y]}
                    stroke={previewEdgeColor}
                    strokeWidth={1.5 / scale}
                    dash={[4 / scale, 4 / scale]}
                />
            )}
            {drawingPoints.map((p, idx) => (
                <Circle
                    key={`drawing-preview-point-${idx}`}
                    x={p.x}
                    y={p.y}
                    radius={4 / scale}
                    fill={drawColor}
                />
            ))}
        </Layer>
    );
}
