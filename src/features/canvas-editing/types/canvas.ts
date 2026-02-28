import type { ObjectCategory, ObjectType } from "@/config/db-ops/enums";

export type { ObjectCategory, ObjectType };

export type ActiveTool = "select" | "addZone" | "addObstacle" | "delete";

export interface CanvasVertex {
    id: string;
    x: number;
    y: number;
}

export interface CanvasObject {
    id: string;
    category: ObjectCategory;
    type: ObjectType;
    vertices: CanvasVertex[];
}
