import { Layer, Circle } from "react-konva";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";
import type { Object, Vertex } from "@/types/schemaTypes";
import { computeEdgeMidpoints, type Point } from "@/features/canvas-editing/utils/canvasGeometry";
import { sameVertex } from "@/features/canvas-editing/utils/canvasObjectUtils";
import {
    COLOR_VERTEX_FILL,
    COLOR_VERTEX_SELECTED_STROKE,
    COLOR_EDGE_MIDPOINT_FILL,
    COLOR_EDGE_MIDPOINT_STROKE,
} from "@/config/canvas-editing/canvasConfig";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID } from "@/config/layers/layerRegistry";

interface CanvasVertexHandlesLayerProps {
    selectedObject: Object | null;
    selectedObjectVertices: Vertex[];
    activeTool: ActiveTool | null;
    scale: number;
    selectedVertices: Vertex[];
    draggingVertex: Vertex | null;
    onVertexClick: (vertex: Vertex, ctrl: boolean) => void;
    onVertexDragStart: (vertex: Vertex) => void;
    onVertexDragMove: (vertex: Vertex, pos: Point) => void;
    onVertexDragEnd: (vertex: Vertex, pos: Point) => void;
    onEdgeMidpointMouseDown: (afterVertex: Vertex, mid: Point) => void;
    onHandleHoverChange: (hovered: boolean) => void;
}

export function CanvasVertexHandlesLayer({
    selectedObject,
    selectedObjectVertices,
    activeTool,
    scale,
    selectedVertices,
    draggingVertex,
    onVertexClick,
    onVertexDragStart,
    onVertexDragMove,
    onVertexDragEnd,
    onEdgeMidpointMouseDown,
    onHandleHoverChange,
}: CanvasVertexHandlesLayerProps) {
    const layers = useLayerSettingsStore((s) => s.layers);
    const isLayerListening = activeTool === "select" && selectedObject !== null;
    const edgeMidpoints = selectedObject ? computeEdgeMidpoints(selectedObjectVertices) : [];
    if (!selectedObject) return <Layer />;

    const accentColor = selectedObject.category === "zone"
        ? (getLayerParam(layers, LAYER_ID.ZONES, "Polygon Edge Color") ?? "#22c55e")
        : (getLayerParam(layers, LAYER_ID.OBSTACLES, "Polygon Edge Color") ?? "#ef4444");

    return (
        <Layer listening={isLayerListening}>
            {selectedObjectVertices.map((v, i) => {
                const mid = edgeMidpoints[i];
                if (!mid) return null;

                const isActiveVertex = selectedVertices.some((sv) => sameVertex(sv, v)) || (draggingVertex !== null && sameVertex(draggingVertex, v));

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
                            onVertexClick(v, e.evt.ctrlKey || e.evt.metaKey);
                        }}
                        onDragStart={() => onVertexDragStart(v)}
                        onDragMove={(e) => onVertexDragMove(v, { x: e.target.x(), y: e.target.y() })}
                        onDragEnd={(e) => onVertexDragEnd(v, { x: e.target.x(), y: e.target.y() })}
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
                            onEdgeMidpointMouseDown(v, mid);
                        }}
                        onMouseEnter={() => onHandleHoverChange(true)}
                        onMouseLeave={() => onHandleHoverChange(false)}
                    />,
                ];
            })}
        </Layer>
    );
}
