import { useRef } from "react";
import { Layer, Line } from "react-konva";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";
import type React from "react";
import type { Object, Vertex } from "@/types/schemaTypes";
import { sameObject } from "@/features/canvas-editing/utils/canvasObjectUtils";
import {
    COLOR_ZONE_FILL,
    COLOR_ZONE_STROKE,
    COLOR_OBSTACLE_FILL,
    COLOR_OBSTACLE_STROKE,
} from "@/config/canvas-editing/canvasConfig";

interface CanvasPolygonObjectsLayerProps {
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

export function CanvasPolygonObjectsLayer({
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

    // Build lookup once per render — O(n) instead of O(n*m)
    const verticesByObjectId = new Map<number, Vertex[]>();
    for (const v of vertices) {
        const list = verticesByObjectId.get(v.objectId) ?? [];
        list.push(v);
        verticesByObjectId.set(v.objectId, list);
    }

    const sortedObjects = [...objects].sort((a, b) => {
        if (a.category === b.category) return 0;
        return a.category === "zone" ? -1 : 1;
    });

    return (
        <Layer>
            {sortedObjects.map((obj) => {
                const isZone = obj.category === "zone";
                const isSelected = selectedObject !== null && sameObject(obj, selectedObject) && activeTool === "select";
                const isMoving = movingObject !== null && sameObject(obj, movingObject);
                const objVerts = verticesByObjectId.get(obj.id) ?? [];

                return (
                    <Line
                        key={obj.id}
                        points={objVerts.flatMap((v) => [v.x, v.y])}
                        closed
                        fill={isZone ? COLOR_ZONE_FILL : COLOR_OBSTACLE_FILL}
                        stroke={isZone ? COLOR_ZONE_STROKE : COLOR_OBSTACLE_STROKE}
                        strokeWidth={(isSelected || isMoving ? 2.5 : 1.5) / scale}
                        opacity={isMoving ? 0.55 : 1}
                        dash={isMoving ? [8 / scale, 4 / scale] : undefined}
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
