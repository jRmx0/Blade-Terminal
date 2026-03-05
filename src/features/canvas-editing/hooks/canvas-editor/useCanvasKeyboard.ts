import { useCallback } from "react";
import type { Object, Vertex } from "@/types/schemaTypes";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";

interface UseCanvasKeyboardOptions {
    activeTool: ActiveTool | null;
    drawingPointsCount: number;
    selectedObject: Object | null;
    selectedVertices: Vertex[];
    setActiveTool: (tool: ActiveTool | null) => void;
    clearSelection: () => void;
    selectVertex: (vertex: Vertex | null) => void;
    deleteObject: (obj: Object) => void;
    deleteVertex: (obj: Object, vertex: Vertex) => void;
    deleteVertices: (obj: Object, vertices: Vertex[]) => void;
    cancelDrawing: () => void;
}

export function useCanvasKeyboard({
    activeTool,
    drawingPointsCount,
    selectedObject,
    selectedVertices,
    setActiveTool,
    clearSelection,
    selectVertex,
    deleteObject,
    deleteVertex,
    deleteVertices,
    cancelDrawing,
}: UseCanvasKeyboardOptions) {
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Escape") {
                e.preventDefault();
                if (activeTool === "addZone" || activeTool === "addObstacle") {
                    if (drawingPointsCount > 0) {
                        cancelDrawing();
                    } else {
                        setActiveTool(null);
                    }
                } else if (activeTool === "select") {
                    if (selectedVertices.length > 0) {
                        selectVertex(null); // deselect vertices, keep object selected
                    } else if (selectedObject !== null) {
                        clearSelection();
                    } else {
                        setActiveTool(null);
                    }
                } else if (activeTool === "delete") {
                    setActiveTool(null);
                }
                return;
            }

            if (e.key === "Delete" && activeTool === "select") {
                if (selectedObject !== null && selectedVertices.length > 0) {
                    deleteVertices(selectedObject, selectedVertices);
                    selectVertex(null);
                } else if (selectedObject !== null) {
                    deleteObject(selectedObject);
                    clearSelection();
                }
            }
        },
        [
            activeTool,
            drawingPointsCount,
            selectedObject,
            selectedVertices,
            setActiveTool,
            clearSelection,
            selectVertex,
            deleteObject,
            deleteVertex,
            deleteVertices,
            cancelDrawing,
        ],
    );

    return { handleKeyDown };
}
