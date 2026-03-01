import { Layer, Circle } from "react-konva";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";
import type { EnvObject, EnvVertex } from "@/types/envTypes";
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
    selectedObject: EnvObject | null;
    selectedObjectVertices: EnvVertex[];
    activeTool: ActiveTool | null;
    scale: number;
    selectedVertexIndices: number[];
    draggingVertexIndex: number | null;
    onVertexClick: (index: number, ctrl: boolean) => void;
    onVertexDragStart: (index: number) => void;
    onVertexDragMove: (objectId: number, index: number, x: number, y: number) => void;
    onVertexDragEnd: (objectId: number, index: number, x: number, y: number) => void;
    onEdgeMidpointMouseDown: (objectId: number, afterIndex: number, midX: number, midY: number) => void;
    onHandleHoverChange: (hovered: boolean) => void;
}

export function CanvasVertexHandlesLayer({
    selectedObject,
    selectedObjectVertices,
    activeTool,
    scale,
    selectedVertexIndices,
    draggingVertexIndex,
    onVertexClick,
    onVertexDragStart,
    onVertexDragMove,
    onVertexDragEnd,
    onEdgeMidpointMouseDown,
    onHandleHoverChange,
}: CanvasVertexHandlesLayerProps) {
    const isLayerListening = activeTool === "select" && selectedObject !== null;

    const edgeMidpoints = selectedObject ? computeEdgeMidpoints(selectedObjectVertices) : [];

    if (!selectedObject) return <Layer />;

    return (
        <Layer listening={isLayerListening}>
            {selectedObjectVertices.map((v, i) => {
                const mid = edgeMidpoints[i];
                if (!mid) return null;

                const accentColor =
                    selectedObject.category === "zone" ? COLOR_ZONE_STROKE : COLOR_OBSTACLE_STROKE;
                const isActiveVertex = selectedVertexIndices.includes(i) || draggingVertexIndex === i;

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
                            onVertexClick(i, e.evt.ctrlKey || e.evt.metaKey);
                        }}
                        onDragStart={() => onVertexDragStart(i)}
                        onDragMove={(e) => onVertexDragMove(selectedObject.id, i, e.target.x(), e.target.y())}
                        onDragEnd={(e) => onVertexDragEnd(selectedObject.id, i, e.target.x(), e.target.y())}
                        onMouseEnter={() => onHandleHoverChange(true)}
                        onMouseLeave={() => onHandleHoverChange(false)}
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
                        onMouseEnter={() => onHandleHoverChange(true)}
                        onMouseLeave={() => onHandleHoverChange(false)}
                    />,
                ];
            })}
        </Layer>
    );
}
