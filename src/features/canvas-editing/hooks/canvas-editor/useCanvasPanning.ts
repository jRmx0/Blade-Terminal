import { useCallback, useRef, useState } from "react";
import type Konva from "konva";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";

export function useCanvasPanning(setPosition: (pos: { x: number; y: number }) => void) {
    const isPanningRef = useRef(false);
    const panLastPosRef = useRef({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

    const handlePanMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button === 1) {
            e.evt.preventDefault();
            isPanningRef.current = true;
            setIsPanning(true);
            panLastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        }
    }, []);

    const handlePanMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isPanningRef.current) return;
        const dx = e.evt.clientX - panLastPosRef.current.x;
        const dy = e.evt.clientY - panLastPosRef.current.y;
        panLastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        const { position: cur } = useCanvasViewStore.getState();
        setPosition({ x: cur.x + dx, y: cur.y + dy });
    }, [setPosition]);

    const handlePanMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button === 1) {
            isPanningRef.current = false;
            setIsPanning(false);
        }
    }, []);

    const handlePanMouseLeave = useCallback(() => {
        isPanningRef.current = false;
        setIsPanning(false);
    }, []);

    return {
        isPanning,
        isPanningRef,
        handlePanMouseDown,
        handlePanMouseMove,
        handlePanMouseUp,
        handlePanMouseLeave,
    };
}
