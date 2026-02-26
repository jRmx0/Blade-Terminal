import { useCallback } from "react";
import type Konva from "konva";
import type { ActiveTool, ObjectType } from "@/features/canvas-editing/types/canvas";
import { useCanvasDrawingStore } from "@/features/canvas-editing/stores/canvasDrawingStore";

interface UseCanvasDrawingOptions {
    activeTool: ActiveTool | null;
    stageRef: React.RefObject<Konva.Stage | null>;
    clearSelection: () => void;
    addObject: (
        category: "zone" | "obstacle",
        points: { x: number; y: number }[],
        type: ObjectType,
    ) => void;
}

export function useCanvasDrawing({
    activeTool,
    stageRef,
    clearSelection,
    addObject,
}: UseCanvasDrawingOptions) {
    const {
        drawingPoints,
        mousePos,
        appendDrawingPoint,
        setMousePos,
        cancelDrawing,
    } = useCanvasDrawingStore();

    const updateDrawingMousePosition = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (activeTool !== "addZone" && activeTool !== "addObstacle") return;
            const stage = stageRef.current;
            if (!stage) return;
            const ptr = stage.getRelativePointerPosition();
            if (ptr) setMousePos({ x: ptr.x, y: ptr.y });
        },
        [activeTool, stageRef, setMousePos],
    );

    const clearDrawingMousePosition = useCallback(() => {
        setMousePos(null);
    }, [setMousePos]);

    const handleStageClick = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (e.evt.button !== 0) return;

            if (activeTool === "addZone" || activeTool === "addObstacle") {
                const stage = stageRef.current;
                if (!stage) return;
                if (e.target !== stage) return;
                const ptr = stage.getRelativePointerPosition();
                if (!ptr) return;
                appendDrawingPoint({ x: ptr.x, y: ptr.y });
                return;
            }

            if (activeTool === "select" && e.target === stageRef.current) {
                clearSelection();
            }
        },
        [activeTool, stageRef, clearSelection, appendDrawingPoint],
    );

    const handlePolygonClose = useCallback(
        (e: Konva.KonvaEventObject<PointerEvent>) => {
            e.evt.preventDefault();
            if (
                (activeTool === "addZone" || activeTool === "addObstacle") &&
                drawingPoints.length >= 3
            ) {
                addObject(
                    activeTool === "addZone" ? "zone" : "obstacle",
                    drawingPoints,
                    "offline",
                );
                cancelDrawing();
            }
        },
        [activeTool, drawingPoints, addObject, cancelDrawing],
    );

    return {
        drawingPoints,
        mousePos,
        updateDrawingMousePosition,
        clearDrawingMousePosition,
        handleStageClick,
        handlePolygonClose,
        cancelDrawing,
    };
}
