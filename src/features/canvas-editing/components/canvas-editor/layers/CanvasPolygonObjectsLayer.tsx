import { Layer, Line } from "react-konva";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";
import type { EnvObject, EnvVertex } from "@/types/envTypes";
import {
    COLOR_ZONE_FILL,
    COLOR_ZONE_STROKE,
    COLOR_OBSTACLE_FILL,
    COLOR_OBSTACLE_STROKE,
} from "@/config/canvas-editing/canvasConfig";

interface CanvasPolygonObjectsLayerProps {
    objects: EnvObject[];
    vertices: EnvVertex[];
    selectedObjectId: number | null;
    movingObjectId: number | null;
    activeTool: ActiveTool | null;
    scale: number;
    onSelectObject: (id: number) => void;
    onDeleteObject: (id: number) => void;
    onObjectHoverChange: (hoveredId: number | null) => void;
    onObjectDragStart: (objectId: number) => void;
    onObjectDragEnd: (objectId: number, dx: number, dy: number) => void;
}

export function CanvasPolygonObjectsLayer({
    objects,
    vertices,
    selectedObjectId,
    movingObjectId,
    activeTool,
    scale,
    onSelectObject,
    onDeleteObject,
    onObjectHoverChange,
    onObjectDragStart,
    onObjectDragEnd,
}: CanvasPolygonObjectsLayerProps) {
    const canInteract = activeTool === "select" || activeTool === "delete";
    const canDrag = activeTool === "select";

    // Build lookup once per render — O(n) instead of O(n*m)
    const verticesByObjectId = new Map<number, EnvVertex[]>();
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
                const isSelected = obj.id === selectedObjectId && activeTool === "select";
                const isMoving = obj.id === movingObjectId;
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
                                onDeleteObject(obj.id);
                            } else if (activeTool === "select") {
                                onSelectObject(obj.id);
                            }
                        }}
                        onDragStart={(e) => {
                            e.cancelBubble = true;
                            onObjectDragStart(obj.id);
                        }}
                        onDragEnd={(e) => {
                            e.cancelBubble = true;
                            const node = e.target;
                            const dx = node.x();
                            const dy = node.y();
                            node.x(0);
                            node.y(0);
                            onObjectDragEnd(obj.id, dx, dy);
                        }}
                        onMouseEnter={() => canInteract && onObjectHoverChange(obj.id)}
                        onMouseLeave={() => onObjectHoverChange(null)}
                    />
                );
            })}
        </Layer>
    );
}
