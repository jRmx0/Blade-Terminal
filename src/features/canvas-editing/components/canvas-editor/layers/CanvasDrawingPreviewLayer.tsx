import { Layer, Line, Circle } from "react-konva";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID } from "@/config/layers/layerRegistry";

interface CanvasDrawingPreviewLayerProps {
    activeTool: ActiveTool | null;
    drawingPoints: Point[];
    mousePos: Point | null;
    scale: number;
}

export function CanvasDrawingPreviewLayer({
    activeTool,
    drawingPoints,
    mousePos,
    scale,
}: CanvasDrawingPreviewLayerProps) {
    const layers = useLayerSettingsStore((s) => s.layers);
    const isDrawing = activeTool === "addZone" || activeTool === "addObstacle";

    if (!isDrawing || drawingPoints.length === 0) return null;

    const drawColor = activeTool === "addZone"
        ? (getLayerParam(layers, LAYER_ID.ZONES, "Polygon Edge Color") ?? "#22c55e")
        : (getLayerParam(layers, LAYER_ID.OBSTACLES, "Polygon Edge Color") ?? "#ef4444");
    const previewEdgeColor = drawColor;
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
