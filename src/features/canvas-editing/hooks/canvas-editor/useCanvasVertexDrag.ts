import { useCallback, useEffect, useRef } from "react";
import type { Vertex } from "@/types/schemaTypes";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";

/**
 * Throttles vertex position updates during Konva drag to one Zustand write
 * per animation frame (~60fps instead of every mousemove event).
 *
 * How it works:
 *   - onDragMove stores the latest x/y in a ref and schedules a single RAF.
 *   - The RAF callback calls `updateVertex` once with the latest position.
 *   - onDragEnd cancels any pending RAF and commits the final position
 *     synchronously so the store is always accurate when the drag finishes.
 */
export function useCanvasVertexDrag(
    updateVertex: (vertex: Vertex, pos: Point) => void,
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
            updateVertex(vertex, pos);
            pendingRef.current = null;
        }
        rafIdRef.current = null;
    }, [updateVertex]);

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

    /** Called on Konva onDragEnd — cancels pending RAF and commits final position. */
    const handleVertexDragEnd = useCallback(
        (vertex: Vertex, pos: Point) => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            pendingRef.current = null;
            updateVertex(vertex, pos);
        },
        [updateVertex],
    );

    return { handleVertexDragMove, handleVertexDragEnd };
}
