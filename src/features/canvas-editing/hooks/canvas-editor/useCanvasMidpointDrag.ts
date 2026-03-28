import { useCallback, useEffect, useRef, useState } from "react";
import type Konva from "konva";
import type { VertexRef } from "@/features/canvas-editing/types/canvas";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";
import { beginBatch, endBatch } from "@/features/canvas-editing/stores/canvasHistoryStore";

interface UseCanvasMidpointDragOptions {
    stageRef: React.RefObject<Konva.Stage | null>;
    insertVertex: (objectId: number, afterIndex: number, pos: Point) => VertexRef;
    moveVertexAt: (ref: VertexRef, pos: Point) => void;
    finalizeVertexMoveAt: (ref: VertexRef) => void;
    selectVertex: (ref: VertexRef | null) => void;
}

export function useCanvasMidpointDrag({
    stageRef,
    insertVertex,
    moveVertexAt,
    finalizeVertexMoveAt,
    selectVertex,
}: UseCanvasMidpointDragOptions) {
    const [midpointDragState, setMidpointDragState] = useState<VertexRef | null>(null);

    // RAF throttle refs — same pattern as useCanvasVertexDrag / useCanvasPanning
    const pendingPosRef = useRef<Point | null>(null);
    const rafIdRef = useRef<number | null>(null);
    // Keep a ref to the current drag state so the RAF callback always sees the latest value
    const dragStateRef = useRef<VertexRef | null>(null);

    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const flush = useCallback(() => {
        const ref = dragStateRef.current;
        const pos = pendingPosRef.current;
        if (ref && pos) {
            moveVertexAt(ref, pos);
            pendingPosRef.current = null;
        }
        rafIdRef.current = null;
    }, [moveVertexAt]);

    const handleMidpointMouseDown = useCallback(
        (objectId: number, afterIndex: number, mid: Point) => {
            beginBatch();
            const newRef = insertVertex(objectId, afterIndex, mid);
            selectVertex(newRef);
            dragStateRef.current = newRef;
            setMidpointDragState(newRef);
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
        finalizeVertexMoveAt(dragStateRef.current);
        dragStateRef.current = null;
        setMidpointDragState(null);
        selectVertex(null);
        endBatch();
    }, [flush, finalizeVertexMoveAt, selectVertex]);

    return {
        isMidpointDragging: midpointDragState !== null,
        handleMidpointMouseDown,
        handleMidpointDragMouseMove,
        handleMidpointDragEnd,
    };
}
