import { Layer, Line } from "react-konva";
import type { CanvasObject, ActiveTool } from "@/features/canvas-editing/types/canvas";
import {
    COLOR_ZONE_FILL,
    COLOR_ZONE_STROKE,
    COLOR_OBSTACLE_FILL,
    COLOR_OBSTACLE_STROKE,
} from "@/config/canvas-editing/canvasConfig";

interface CanvasPolygonObjectsLayerProps {
    objects: CanvasObject[];
    selectedObjectId: string | null;
    activeTool: ActiveTool | null;
    scale: number;
    onSelectObject: (id: string) => void;
    onDeleteObject: (id: string) => void;
}

export function CanvasPolygonObjectsLayer({
    objects,
    selectedObjectId,
    activeTool,
    scale,
    onSelectObject,
    onDeleteObject,
}: CanvasPolygonObjectsLayerProps) {
    const canInteract = activeTool === "select" || activeTool === "delete";

    return (
        <Layer>
            {objects.map((obj) => {
                const isZone = obj.category === "zone";
                const isSelected = obj.id === selectedObjectId;

                return (
                    <Line
                        key={obj.id}
                        points={obj.vertices.flatMap((v) => [v.x, v.y])}
                        closed
                        fill={isZone ? COLOR_ZONE_FILL : COLOR_OBSTACLE_FILL}
                        stroke={isZone ? COLOR_ZONE_STROKE : COLOR_OBSTACLE_STROKE}
                        strokeWidth={(isSelected ? 2.5 : 1.5) / scale}
                        listening={canInteract}
                        hitStrokeWidth={8 / scale}
                        onClick={(e) => {
                            e.cancelBubble = true;
                            if (activeTool === "delete") {
                                onDeleteObject(obj.id);
                            } else if (activeTool === "select") {
                                onSelectObject(obj.id);
                            }
                        }}
                    />
                );
            })}
        </Layer>
    );
}
