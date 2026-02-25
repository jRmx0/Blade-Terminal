import { useCallback } from "react";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";

interface UseCanvasKeyboardOptions {
    activeTool: ActiveTool | null;
    drawingPointsCount: number;
    selectedObjectId: string | null;
    selectedVertexIndex: number | null;
    setActiveTool: (tool: ActiveTool | null) => void;
    clearSelection: () => void;
    deleteVertex: (objectId: string, vertexIndex: number) => void;
    cancelDrawing: () => void;
}

export function useCanvasKeyboard({
    activeTool,
    drawingPointsCount,
    selectedObjectId,
    selectedVertexIndex,
    setActiveTool,
    clearSelection,
    deleteVertex,
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
                    if (selectedObjectId !== null || selectedVertexIndex !== null) {
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
                if (selectedObjectId !== null && selectedVertexIndex !== null) {
                    deleteVertex(selectedObjectId, selectedVertexIndex);
                }
            }
        },
        [
            activeTool,
            drawingPointsCount,
            selectedObjectId,
            selectedVertexIndex,
            setActiveTool,
            clearSelection,
            deleteVertex,
            cancelDrawing,
        ],
    );

    return { handleKeyDown };
}
