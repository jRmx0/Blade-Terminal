import { useCallback, useState } from "react";
import type Konva from "konva";
import type { ActiveTool, ObjectType } from "@/features/canvas-editing/types/canvas";

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
    const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

    const updateDrawingMousePosition = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (activeTool !== "addZone" && activeTool !== "addObstacle") return;
            const stage = stageRef.current;
            if (!stage) return;
            const ptr = stage.getRelativePointerPosition();
            if (ptr) setMousePos({ x: ptr.x, y: ptr.y });
        },
        [activeTool, stageRef],
    );

    const clearDrawingMousePosition = useCallback(() => {
        setMousePos(null);
    }, []);

    const handleStageClick = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (e.evt.button !== 0) return;

            if (activeTool === "addZone" || activeTool === "addObstacle") {
                const stage = stageRef.current;
                if (!stage) return;
                if (e.target !== stage) return;
                const ptr = stage.getRelativePointerPosition();
                if (!ptr) return;
                setDrawingPoints((prev) => [...prev, { x: ptr.x, y: ptr.y }]);
                return;
            }

            if (activeTool === "select" && e.target === stageRef.current) {
                clearSelection();
            }
        },
        [activeTool, stageRef, clearSelection],
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
                    "off-line",
                );
                setDrawingPoints([]);
                setMousePos(null);
            }
        },
        [activeTool, drawingPoints, addObject],
    );

    const cancelDrawing = useCallback(() => {
        setDrawingPoints([]);
        setMousePos(null);
    }, []);

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
