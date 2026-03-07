import { useCallback, useEffect, useRef } from "react";
import type Konva from "konva";
import type { ActiveTool } from "@/features/canvas-editing/types/canvas";
import type { ObjectType } from "@/config/db-ops/enums";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";
import { defaultObjectTypeForGlobal } from "@/config/db-ops/enums";
import { useCanvasDrawingStore } from "@/features/canvas-editing/stores/canvasDrawingStore";
import { useEnvStore } from "@/stores/envStore";

interface UseCanvasDrawingOptions {
    activeTool: ActiveTool | null;
    stageRef: React.RefObject<Konva.Stage | null>;
    clearSelection: () => void;
    addObject: (
        category: "zone" | "obstacle",
        points: Point[],
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

    // RAF throttle — only write mousePos to Zustand once per display frame
    const pendingMousePosRef = useRef<Point | null>(null);
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const flushMousePos = useCallback(() => {
        if (pendingMousePosRef.current) {
            setMousePos(pendingMousePosRef.current);
            pendingMousePosRef.current = null;
        }
        rafIdRef.current = null;
    }, [setMousePos]);

    const updateDrawingMousePosition = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (activeTool !== "addZone" && activeTool !== "addObstacle") return;
            const stage = stageRef.current;
            if (!stage) return;
            const ptr = stage.getRelativePointerPosition();
            if (!ptr) return;
            pendingMousePosRef.current = { x: ptr.x, y: ptr.y };
            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(flushMousePos);
            }
        },
        [activeTool, stageRef, flushMousePos],
    );

    const clearDrawingMousePosition = useCallback(() => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        pendingMousePosRef.current = null;
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
                const objectType = defaultObjectTypeForGlobal(useEnvStore.getState().env.type);
                addObject(
                    activeTool === "addZone" ? "zone" : "obstacle",
                    drawingPoints,
                    objectType,
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
