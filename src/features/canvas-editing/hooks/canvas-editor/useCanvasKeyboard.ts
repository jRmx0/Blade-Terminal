import { useCallback } from "react";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";

interface UseCanvasKeyboardOptions {
    activeTool: ActiveTool | null;
    drawingPointsCount: number;
    selectedObjectId: string | null;
    selectedVertexIndices: number[];
    setActiveTool: (tool: ActiveTool | null) => void;
    clearSelection: () => void;
    deleteObject: (id: string) => void;
    deleteVertex: (objectId: string, vertexIndex: number) => void;
    deleteVertices: (objectId: string, indices: number[]) => void;
    cancelDrawing: () => void;
}

export function useCanvasKeyboard({
    activeTool,
    drawingPointsCount,
    selectedObjectId,
    selectedVertexIndices,
    setActiveTool,
    clearSelection,
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
                    if (selectedObjectId !== null || selectedVertexIndices.length > 0) {
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
                if (selectedObjectId !== null && selectedVertexIndices.length > 0) {
                    deleteVertices(selectedObjectId, selectedVertexIndices);
                } else if (selectedObjectId !== null) {
                    deleteObject(selectedObjectId);
                }
            }
        },
        [
            activeTool,
            drawingPointsCount,
            selectedObjectId,
            selectedVertexIndices,
            setActiveTool,
            clearSelection,
            deleteObject,
            deleteVertex,
            deleteVertices,
            cancelDrawing,
        ],
    );

    return { handleKeyDown };
}
