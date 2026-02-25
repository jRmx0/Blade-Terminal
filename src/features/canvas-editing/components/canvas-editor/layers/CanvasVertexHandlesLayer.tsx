import { Layer, Circle } from "react-konva";
import type { CanvasObject, ActiveTool } from "@/features/canvas-editing/types/canvas";
import { computeEdgeMidpoints } from "@/features/canvas-editing/utils/canvasGeometry";
import {
    COLOR_ZONE_STROKE,
    COLOR_OBSTACLE_STROKE,
    COLOR_VERTEX_FILL,
    COLOR_VERTEX_SELECTED_STROKE,
    COLOR_EDGE_MIDPOINT_FILL,
    COLOR_EDGE_MIDPOINT_STROKE,
} from "@/config/canvas-editing/canvasConfig";

interface CanvasVertexHandlesLayerProps {
    selectedObject: CanvasObject | null;
    activeTool: ActiveTool | null;
    scale: number;
    selectedVertexIndex: number | null;
    draggingVertexIndex: number | null;
    onVertexClick: (index: number) => void;
    onVertexDragStart: (index: number) => void;
    onVertexDragMove: (objectId: string, index: number, x: number, y: number) => void;
    onVertexDragEnd: (objectId: string, index: number, x: number, y: number) => void;
    onEdgeMidpointMouseDown: (objectId: string, afterIndex: number, midX: number, midY: number) => void;
}

export function CanvasVertexHandlesLayer({
    selectedObject,
    activeTool,
    scale,
    selectedVertexIndex,
    draggingVertexIndex,
    onVertexClick,
    onVertexDragStart,
    onVertexDragMove,
    onVertexDragEnd,
    onEdgeMidpointMouseDown,
}: CanvasVertexHandlesLayerProps) {
    const isLayerListening = activeTool === "select" && selectedObject !== null;

    const edgeMidpoints = selectedObject ? computeEdgeMidpoints(selectedObject.vertices) : [];

    return (
        <Layer listening={isLayerListening}>
            {selectedObject?.vertices.map((v, i) => {
                const mid = edgeMidpoints[i];
                if (!mid) return null;

                const accentColor =
                    selectedObject.category === "zone" ? COLOR_ZONE_STROKE : COLOR_OBSTACLE_STROKE;
                const isActiveVertex = selectedVertexIndex === i || draggingVertexIndex === i;

                return [
                    <Circle
                        key={`vertex-handle-${v.id}`}
                        x={v.x}
                        y={v.y}
                        radius={6 / scale}
                        fill={COLOR_VERTEX_FILL}
                        stroke={isActiveVertex ? COLOR_VERTEX_SELECTED_STROKE : accentColor}
                        strokeWidth={isActiveVertex ? 3 / scale : 2 / scale}
                        draggable
                        onClick={(e) => {
                            e.cancelBubble = true;
                            onVertexClick(i);
                        }}
                        onDragStart={() => onVertexDragStart(i)}
                        onDragMove={(e) => onVertexDragMove(selectedObject.id, i, e.target.x(), e.target.y())}
                        onDragEnd={(e) => onVertexDragEnd(selectedObject.id, i, e.target.x(), e.target.y())}
                    />,
                    <Circle
                        key={`edge-midpoint-handle-${v.id}`}
                        x={mid.x}
                        y={mid.y}
                        radius={4 / scale}
                        fill={COLOR_EDGE_MIDPOINT_FILL}
                        stroke={COLOR_EDGE_MIDPOINT_STROKE}
                        strokeWidth={1.5 / scale}
                        onMouseDown={(e) => {
                            e.cancelBubble = true;
                            onEdgeMidpointMouseDown(selectedObject.id, i, mid.x, mid.y);
                        }}
                    />,
                ];
            })}
        </Layer>
    );
}
