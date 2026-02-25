export type ObjectCategory = "zone" | "obstacle";

export type ObjectType = "on-line" | "off-line";

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
