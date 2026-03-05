import { useCallback, useEffect, useRef } from "react";
import type { Vertex } from "@/types/schemaTypes";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";

/**
 * Throttles vertex position updates during Konva drag to one Zustand write
 * per animation frame (~60fps instead of every mousemove event).
 *
 * How it works:
 *   - onDragMove stores the latest x/y in a ref and schedules a single RAF.
 *   - The RAF callback calls `moveVertexXY` once with the latest position (no sync, no dirty).
 *   - onDragEnd cancels any pending RAF, commits the final x/y, then calls
 *     `finalizeVertexMove` once to run syncObject + mark dirty.
 */
export function useCanvasVertexDrag(
    moveVertexXY: (vertex: Vertex, pos: Point) => void,
    finalizeVertexMove: (vertex: Vertex) => void,
) {
    const pendingRef = useRef<{ vertex: Vertex; pos: Point } | null>(null);
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const flush = useCallback(() => {
        if (pendingRef.current) {
            const { vertex, pos } = pendingRef.current;
            moveVertexXY(vertex, pos);
            pendingRef.current = null;
        }
        rafIdRef.current = null;
    }, [moveVertexXY]);

    /** Called on every Konva onDragMove — accumulates, schedules at most one RAF/frame. */
    const handleVertexDragMove = useCallback(
        (vertex: Vertex, pos: Point) => {
            pendingRef.current = { vertex, pos };
            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(flush);
            }
        },
        [flush],
    );

    /** Called on Konva onDragEnd — commits final position then syncs once. */
    const handleVertexDragEnd = useCallback(
        (vertex: Vertex, pos: Point) => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            pendingRef.current = null;
            moveVertexXY(vertex, pos);
            finalizeVertexMove(vertex);
        },
        [moveVertexXY, finalizeVertexMove],
    );

    return { handleVertexDragMove, handleVertexDragEnd };
}
