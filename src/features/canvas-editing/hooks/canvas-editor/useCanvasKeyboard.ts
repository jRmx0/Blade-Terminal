import { useCallback } from "react";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";

interface UseCanvasKeyboardOptions {
    activeTool: ActiveTool | null;
    drawingPointsCount: number;
    selectedObjectId: number | null;
    selectedVertexIndices: number[];
    setActiveTool: (tool: ActiveTool | null) => void;
    clearSelection: () => void;
    selectVertex: (index: number | null) => void;
    deleteObject: (id: number) => void;
    deleteVertex: (objectId: number, vertexIndex: number) => void;
    deleteVertices: (objectId: number, indices: number[]) => void;
    cancelDrawing: () => void;
    onSave: () => void;
}

export function useCanvasKeyboard({
    activeTool,
    drawingPointsCount,
    selectedObjectId,
    selectedVertexIndices,
    setActiveTool,
    clearSelection,
    selectVertex,
    deleteObject,
    deleteVertex,
    deleteVertices,
    cancelDrawing,
    onSave,
}: UseCanvasKeyboardOptions) {
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                onSave();
                return;
            }

            if (e.key === "Escape") {
                e.preventDefault();
                if (activeTool === "addZone" || activeTool === "addObstacle") {
                    if (drawingPointsCount > 0) {
                        cancelDrawing();
                    } else {
                        setActiveTool(null);
                    }
                } else if (activeTool === "select") {
                    if (selectedVertexIndices.length > 0) {
                        selectVertex(null); // deselect vertices, keep object selected
                    } else if (selectedObjectId !== null) {
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
                    selectVertex(null);
                } else if (selectedObjectId !== null) {
                    deleteObject(selectedObjectId);
                    clearSelection();
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
            selectVertex,
            deleteObject,
            deleteVertex,
            deleteVertices,
            cancelDrawing,
            onSave,
        ],
    );

    return { handleKeyDown };
}
