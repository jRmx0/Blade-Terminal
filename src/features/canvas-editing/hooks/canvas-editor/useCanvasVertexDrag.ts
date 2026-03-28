import { useCallback, useEffect, useRef } from "react";
import type { VertexRef } from "@/features/canvas-editing/types/canvas";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";

/**
 * Throttles vertex position updates during Konva drag to one Zustand write
 * per animation frame (~60fps instead of every mousemove event).
 *
 * How it works:
 *   - onDragMove stores the latest x/y in a ref and schedules a single RAF.
 *   - The RAF callback calls `moveVertexAt` once with the latest position (no sync, no dirty).
 *   - onDragEnd cancels any pending RAF, commits the final x/y, then calls
 *     `finalizeVertexMoveAt` once to run syncObject + mark dirty.
 */
export function useCanvasVertexDrag(
    moveVertexAt: (ref: VertexRef, pos: Point) => void,
    finalizeVertexMoveAt: (ref: VertexRef) => void,
) {
    const pendingRef = useRef<{ ref: VertexRef; pos: Point } | null>(null);
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const flush = useCallback(() => {
        if (pendingRef.current) {
            const { ref, pos } = pendingRef.current;
            moveVertexAt(ref, pos);
            pendingRef.current = null;
        }
        rafIdRef.current = null;
    }, [moveVertexAt]);

    /** Called on every Konva onDragMove — accumulates, schedules at most one RAF/frame. */
    const handleVertexDragMove = useCallback(
        (ref: VertexRef, pos: Point) => {
            pendingRef.current = { ref, pos };
            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(flush);
            }
        },
        [flush],
    );

    /** Called on Konva onDragEnd — commits final position then syncs once. */
    const handleVertexDragEnd = useCallback(
        (ref: VertexRef, pos: Point) => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            pendingRef.current = null;
            moveVertexAt(ref, pos);
            finalizeVertexMoveAt(ref);
        },
        [moveVertexAt, finalizeVertexMoveAt],
    );

    return { handleVertexDragMove, handleVertexDragEnd };
}
