import { useCallback, useEffect, useRef } from "react";

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
    updateVertex: (objectId: string, index: number, x: number, y: number) => void,
) {
    const pendingRef = useRef<{ objectId: string; index: number; x: number; y: number } | null>(null);
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const flush = useCallback(() => {
        if (pendingRef.current) {
            const { objectId, index, x, y } = pendingRef.current;
            updateVertex(objectId, index, x, y);
            pendingRef.current = null;
        }
        rafIdRef.current = null;
    }, [updateVertex]);

    /** Called on every Konva onDragMove — accumulates, schedules at most one RAF/frame. */
    const handleVertexDragMove = useCallback(
        (objectId: string, index: number, x: number, y: number) => {
            pendingRef.current = { objectId, index, x, y };
            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(flush);
            }
        },
        [flush],
    );

    /** Called on Konva onDragEnd — cancels pending RAF and commits final position. */
    const handleVertexDragEnd = useCallback(
        (objectId: string, index: number, x: number, y: number) => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            pendingRef.current = null;
            updateVertex(objectId, index, x, y);
        },
        [updateVertex],
    );

    return { handleVertexDragMove, handleVertexDragEnd };
}
