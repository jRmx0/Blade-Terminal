import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import type Konva from "konva";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";

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
    setPosition: (pos: { x: number; y: number }) => void,
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

    const handlePanMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isPanningRef.current) return;
        const dx = e.evt.clientX - panLastPosRef.current.x;
        const dy = e.evt.clientY - panLastPosRef.current.y;
        panLastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        // Accumulate — RAF will consume on next frame
        pendingDeltaRef.current.x += dx;
        pendingDeltaRef.current.y += dy;
        scheduleFlush();
    }, [scheduleFlush]);

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

    const handlePanMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button === 1) stopPanning();
    }, [stopPanning]);

    const handlePanMouseLeave = useCallback(() => {
        stopPanning();
    }, [stopPanning]);

    return {
        isPanning,
        isPanningRef,
        handlePanMouseDown,
        handlePanMouseMove,
        handlePanMouseUp,
        handlePanMouseLeave,
    };
}
