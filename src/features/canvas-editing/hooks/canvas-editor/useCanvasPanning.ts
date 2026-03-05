import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import type Konva from "konva";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";

/**
 * Handles middle-mouse-button canvas panning.
 *
 * Performance design: mousemove events only accumulate deltas into a ref.
 * A single requestAnimationFrame fires at most once per display frame and
 * applies the accumulated delta directly to the Konva Stage (zero React
 * re-renders during panning), then syncs the Zustand position store so
 * React-Konva confirms the new position on its next render pass.
 */
export function useCanvasPanning(
    stageRef: React.RefObject<Konva.Stage | null>,
    setPosition: (pos: Point) => void,
) {
    const isPanningRef = useRef(false);
    const panLastPosRef = useRef({ x: 0, y: 0 });
    const pendingDeltaRef = useRef({ x: 0, y: 0 });
    const rafIdRef = useRef<number | null>(null);
    const [isPanning, setIsPanning] = useState(false);

    // Cancel any pending RAF when the hook unmounts
    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    /**
     * Applies the accumulated delta to the stage directly (bypassing React)
     * and then commits the new position to Zustand so props stay in sync.
     */
    const flushPosition = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return;

        const { position: cur } = useCanvasViewStore.getState();
        const next = {
            x: cur.x + pendingDeltaRef.current.x,
            y: cur.y + pendingDeltaRef.current.y,
        };

        // Mutate the Konva stage directly — no React render cost
        stage.position(next);
        stage.batchDraw();

        pendingDeltaRef.current = { x: 0, y: 0 };
        rafIdRef.current = null;

        // Sync Zustand (triggers at most one React render per frame)
        setPosition(next);
    }, [stageRef, setPosition]);

    /** Schedules a flush only if one is not already queued for this frame. */
    const scheduleFlush = useCallback(() => {
        if (rafIdRef.current !== null) return;
        rafIdRef.current = requestAnimationFrame(flushPosition);
    }, [flushPosition]);

    const handlePanMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button === 1) {
            e.evt.preventDefault();
            isPanningRef.current = true;
            setIsPanning(true);
            panLastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
            pendingDeltaRef.current = { x: 0, y: 0 };
        }
    }, []);

    /** Stops panning and immediately flushes any remaining delta. */
    const stopPanning = useCallback(() => {
        if (!isPanningRef.current) return;
        isPanningRef.current = false;
        setIsPanning(false);
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        // Flush whatever delta was not yet applied
        flushPosition();
    }, [flushPosition]);

    // Attach document-level listeners so panning continues even when the
    // mouse leaves the canvas element (e.g. over an overlaid panel).
    useEffect(() => {
        const onDocMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return;
            const dx = e.clientX - panLastPosRef.current.x;
            const dy = e.clientY - panLastPosRef.current.y;
            panLastPosRef.current = { x: e.clientX, y: e.clientY };
            pendingDeltaRef.current.x += dx;
            pendingDeltaRef.current.y += dy;
            scheduleFlush();
        };
        const onDocMouseUp = (e: MouseEvent) => {
            if (e.button === 1) stopPanning();
        };
        document.addEventListener("mousemove", onDocMouseMove);
        document.addEventListener("mouseup", onDocMouseUp);
        return () => {
            document.removeEventListener("mousemove", onDocMouseMove);
            document.removeEventListener("mouseup", onDocMouseUp);
        };
    }, [scheduleFlush, stopPanning]);

    // No-ops: document-level listeners (below) handle all movement and release
    // so we don't double-count deltas when the mouse is over the canvas.
    const handlePanMouseMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => { }, []);
    const handlePanMouseUp = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => { }, []);
    // No-op: panning no longer stops on mouse-leave (document listeners handle it).
    const handlePanMouseLeave = useCallback(() => { }, []);

    return {
        isPanning,
        isPanningRef,
        handlePanMouseDown,
        handlePanMouseMove,
        handlePanMouseUp,
        handlePanMouseLeave,
    };
}
