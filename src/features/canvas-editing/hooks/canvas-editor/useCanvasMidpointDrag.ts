import { useCallback, useEffect, useRef, useState } from "react";
import type Konva from "konva";
import type { Vertex } from "@/types/schemaTypes";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";
import { beginBatch, endBatch } from "@/features/canvas-editing/stores/canvasHistoryStore";

interface UseCanvasMidpointDragOptions {
    stageRef: React.RefObject<Konva.Stage | null>;
    insertVertex: (afterVertex: Vertex, pos: Point) => Vertex;
    moveVertexXY: (vertex: Vertex, pos: Point) => void;
    finalizeVertexMove: (vertex: Vertex) => void;
    selectVertex: (vertex: Vertex | null) => void;
}

export function useCanvasMidpointDrag({
    stageRef,
    insertVertex,
    moveVertexXY,
    finalizeVertexMove,
    selectVertex,
}: UseCanvasMidpointDragOptions) {
    const [midpointDragState, setMidpointDragState] = useState<Vertex | null>(null);

    // RAF throttle refs — same pattern as useCanvasVertexDrag / useCanvasPanning
    const pendingPosRef = useRef<Point | null>(null);
    const rafIdRef = useRef<number | null>(null);
    // Keep a ref to the current drag state so the RAF callback always sees the latest value
    const dragStateRef = useRef<Vertex | null>(null);

    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const flush = useCallback(() => {
        const vertex = dragStateRef.current;
        const pos = pendingPosRef.current;
        if (vertex && pos) {
            moveVertexXY(vertex, pos);
            pendingPosRef.current = null;
        }
        rafIdRef.current = null;
    }, [moveVertexXY]);

    const handleMidpointMouseDown = useCallback(
        (afterVertex: Vertex, mid: Point) => {
            beginBatch();
            const newVertex = insertVertex(afterVertex, mid);
            selectVertex(newVertex);
            dragStateRef.current = newVertex;
            setMidpointDragState(newVertex);
        },
        [insertVertex, selectVertex],
    );

    /** Drives the newly inserted vertex position during a midpoint drag — RAF-throttled. */
    const handleMidpointDragMouseMove = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (!dragStateRef.current) return;
            const stage = stageRef.current;
            if (!stage) return;
            const ptr = stage.getRelativePointerPosition();
            if (!ptr) return;
            // Accumulate latest pointer position; schedule a single RAF per frame
            pendingPosRef.current = { x: ptr.x, y: ptr.y };
            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(flush);
            }
        },
        [stageRef, flush],
    );

    const handleMidpointDragEnd = useCallback(() => {
        if (!dragStateRef.current) return;
        // Cancel pending RAF and synchronously apply any remaining delta
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        flush();
        finalizeVertexMove(dragStateRef.current);
        dragStateRef.current = null;
        setMidpointDragState(null);
        selectVertex(null);
        endBatch();
    }, [flush, finalizeVertexMove, selectVertex]);

    return {
        isMidpointDragging: midpointDragState !== null,
        handleMidpointMouseDown,
        handleMidpointDragMouseMove,
        handleMidpointDragEnd,
    };
}
