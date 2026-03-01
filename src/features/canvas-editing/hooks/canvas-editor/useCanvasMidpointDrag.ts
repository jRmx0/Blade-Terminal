import { useCallback, useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { beginBatch, endBatch } from "@/features/canvas-editing/stores/canvasHistoryStore";

interface UseCanvasMidpointDragOptions {
    stageRef: React.RefObject<Konva.Stage | null>;
    insertVertex: (objectId: number, afterIndex: number, x: number, y: number) => void;
    updateVertex: (objectId: number, vertexIndex: number, x: number, y: number) => void;
    selectVertex: (index: number | null) => void;
}

interface MidpointDragState {
    objectId: number;
    vertexIndex: number;
}

export function useCanvasMidpointDrag({
    stageRef,
    insertVertex,
    updateVertex,
    selectVertex,
}: UseCanvasMidpointDragOptions) {
    const [midpointDragState, setMidpointDragState] = useState<MidpointDragState | null>(null);

    // RAF throttle refs — same pattern as useCanvasVertexDrag / useCanvasPanning
    const pendingPosRef = useRef<{ x: number; y: number } | null>(null);
    const rafIdRef = useRef<number | null>(null);
    // Keep a ref to the current drag state so the RAF callback always sees the latest value
    const dragStateRef = useRef<MidpointDragState | null>(null);

    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const flush = useCallback(() => {
        const state = dragStateRef.current;
        const pos = pendingPosRef.current;
        if (state && pos) {
            updateVertex(state.objectId, state.vertexIndex, pos.x, pos.y);
            pendingPosRef.current = null;
        }
        rafIdRef.current = null;
    }, [updateVertex]);

    const handleMidpointMouseDown = useCallback(
        (objectId: number, afterIndex: number, midX: number, midY: number) => {
            beginBatch();
            insertVertex(objectId, afterIndex, midX, midY);
            selectVertex(afterIndex + 1);
            const state = { objectId, vertexIndex: afterIndex + 1 };
            dragStateRef.current = state;
            setMidpointDragState(state);
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

    /** Ends the midpoint drag — cancels pending RAF, flushes final position, then closes batch. */
    const handleMidpointDragEnd = useCallback(() => {
        if (!dragStateRef.current) return;
        // Cancel pending RAF and synchronously apply any remaining delta
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        flush();
        dragStateRef.current = null;
        setMidpointDragState(null);
        selectVertex(null);
        endBatch();
    }, [flush, selectVertex]);

    return {
        isMidpointDragging: midpointDragState !== null,
        handleMidpointMouseDown,
        handleMidpointDragMouseMove,
        handleMidpointDragEnd,
    };
}
