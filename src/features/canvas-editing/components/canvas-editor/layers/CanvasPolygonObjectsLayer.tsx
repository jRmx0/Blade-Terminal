import { memo, useMemo, useRef } from "react";
import { Layer, Line } from "react-konva";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";
import type React from "react";
import type { Object, Vertex } from "@/types/schemaTypes";
import { sameObject } from "@/features/canvas-editing/utils/canvasObjectUtils";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID } from "@/config/layers/layerRegistry";
import { OBJECT_TYPE } from "@/config/db-ops/enums";

function createStripePatternCanvas(bgColor: string, stripeColor: string): HTMLCanvasElement {
    const stripeH = 16;
    const gap = 16;
    const tileSize = stripeH + gap;
    const canvas = document.createElement("canvas");
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, tileSize, tileSize);
    ctx.fillStyle = stripeColor;
    ctx.fillRect(0, 0, tileSize, stripeH);
    return canvas;
}

interface CanvasPolygonObjectsLayerProps {
    category: "zone" | "obstacle";
    objects: Object[];
    vertices: Vertex[];
    selectedObject: Object | null;
    movingObject: Object | null;
    activeTool: ActiveTool | null;
    scale: number;
    onSelectObject: (obj: Object) => void;
    onDeleteObject: (obj: Object) => void;
    onObjectHoverChange: (obj: Object | null) => void;
    onObjectDragStart: (obj: Object) => void;
    onObjectDragEnd: (obj: Object, dx: number, dy: number) => void;
    isPanningRef: React.RefObject<boolean>;
}

export function _CanvasPolygonObjectsLayer({
    category,
    objects,
    vertices,
    selectedObject,
    movingObject,
    activeTool,
    scale,
    onSelectObject,
    onDeleteObject,
    onObjectHoverChange,
    onObjectDragStart,
    onObjectDragEnd,
    isPanningRef,
}: CanvasPolygonObjectsLayerProps) {
    const canInteract = activeTool === "select" || activeTool === "delete";
    const canDrag = activeTool === "select";

    // Coordinates onDragStart/onDragEnd: only true when a left-button drag is active.
    const primaryDragRef = useRef(false);

    const layerId = category === "zone" ? LAYER_ID.ZONES : LAYER_ID.OBSTACLES;
    const layers = useLayerSettingsStore((s) => s.layers);
    const visible = getLayerParam(layers, layerId, "Visible") !== "false";
    const stroke = getLayerParam(layers, layerId, "Polygon Edge Color") ?? (category === "zone" ? "#22c55e" : "#ef4444");
    const fill = getLayerParam(layers, layerId, "Polygon Fill Color") ?? (category === "zone" ? "#22c55e2e" : "#ef44443b");
    const edgeWidth = parseFloat(getLayerParam(layers, layerId, "Polygon Edge Width") ?? "1.5");

    const onlinePattern = useMemo(
        () => createStripePatternCanvas(fill, fill),
        [fill],
    );

    // Build lookup once per render — O(n) instead of O(n*m)
    const verticesByObjectId = new Map<number, Vertex[]>();
    for (const v of vertices) {
        const list = verticesByObjectId.get(v.objectId) ?? [];
        list.push(v);
        verticesByObjectId.set(v.objectId, list);
    }

    const visibleObjects = visible
        ? objects.filter((obj) => obj.category === category)
        : [];

    return (
        <Layer>
            {visibleObjects.map((obj) => {
                const isOnline = obj.type === OBJECT_TYPE.ONLINE;
                const isSelected = selectedObject !== null && sameObject(obj, selectedObject) && activeTool === "select";
                const isMoving = movingObject !== null && sameObject(obj, movingObject);
                const objVerts = verticesByObjectId.get(obj.id) ?? [];
                const fillPattern = isOnline ? onlinePattern : undefined;

                return (
                    <Line
                        key={obj.id}
                        points={objVerts.flatMap((v) => [v.x, v.y])}
                        closed
                        fill={fillPattern ? undefined : fill}
                        fillPatternImage={fillPattern as unknown as HTMLImageElement}
                        fillPatternRotation={fillPattern ? 45 : undefined}
                        stroke={stroke}
                        strokeWidth={(isSelected || isMoving ? edgeWidth * 1.5 : edgeWidth) / scale}
                        opacity={isMoving ? 0.55 : 1}
                        dash={isMoving ? [8 / scale, 4 / scale] : isOnline ? [16 / scale, 4 / scale] : undefined}
                        listening={canInteract}
                        hitStrokeWidth={8 / scale}
                        draggable={canDrag}
                        dragDistance={4}
                        onClick={(e) => {
                            e.cancelBubble = true;
                            if (activeTool === "delete") {
                                onDeleteObject(obj);
                            } else if (activeTool === "select") {
                                onSelectObject(obj);
                            }
                        }}
                        onDragStart={(e) => {
                            if (isPanningRef.current) {
                                // Middle-mouse pan is active — abort the drag without
                                // cancelling bubble so mousemove keeps reaching the stage.
                                e.target.stopDrag();
                                return;
                            }
                            primaryDragRef.current = true;
                            e.cancelBubble = true;
                            onObjectDragStart(obj);
                        }}
                        onDragEnd={(e) => {
                            if (!primaryDragRef.current) return;
                            primaryDragRef.current = false;
                            e.cancelBubble = true;
                            const node = e.target;
                            const dx = node.x();
                            const dy = node.y();
                            node.x(0);
                            node.y(0);
                            onObjectDragEnd(obj, dx, dy);
                        }}
                        onMouseEnter={() => canInteract && onObjectHoverChange(obj)}
                        onMouseLeave={() => onObjectHoverChange(null)}
                    />
                );
            })}
        </Layer>
    );
}

export const CanvasPolygonObjectsLayer = memo(_CanvasPolygonObjectsLayer);
