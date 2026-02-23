export type ObjectCategory = "zone" | "obstacle";

export type ActiveTool = "select" | "addZone" | "addObstacle" | "delete";

export interface CanvasVertex {
    id: string;
    x: number;
    y: number;
}

export interface CanvasObject {
    id: string;
    category: ObjectCategory;
    vertices: CanvasVertex[];
}
