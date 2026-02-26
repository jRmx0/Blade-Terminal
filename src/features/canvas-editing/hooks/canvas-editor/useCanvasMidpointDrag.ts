import { useCallback, useState } from "react";
import type Konva from "konva";

interface UseCanvasMidpointDragOptions {
    stageRef: React.RefObject<Konva.Stage | null>;
    insertVertex: (objectId: string, afterIndex: number, x: number, y: number) => void;
    updateVertex: (objectId: string, vertexIndex: number, x: number, y: number) => void;
    selectVertex: (index: number | null) => void;
}

interface MidpointDragState {
    objectId: string;
    vertexIndex: number;
}

export function useCanvasMidpointDrag({
    stageRef,
    insertVertex,
    updateVertex,
    selectVertex,
}: UseCanvasMidpointDragOptions) {
    const [midpointDragState, setMidpointDragState] = useState<MidpointDragState | null>(null);

    const handleMidpointMouseDown = useCallback(
        (objectId: string, afterIndex: number, midX: number, midY: number) => {
            insertVertex(objectId, afterIndex, midX, midY);
            setMidpointDragState({ objectId, vertexIndex: afterIndex + 1 });
        },
        [insertVertex],
    );

    /** Drives the newly inserted vertex position during a midpoint drag. */
    const handleMidpointDragMouseMove = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (!midpointDragState) return;
            const stage = stageRef.current;
            if (!stage) return;
            const ptr = stage.getRelativePointerPosition();
            if (!ptr) return;
            updateVertex(midpointDragState.objectId, midpointDragState.vertexIndex, ptr.x, ptr.y);
        },
        [midpointDragState, stageRef, updateVertex],
    );

    /** Ends the midpoint drag on mouseup or mouseleave. */
    const handleMidpointDragEnd = useCallback(() => {
        setMidpointDragState(null);
        selectVertex(null);
    }, [selectVertex]);

    return {
        isMidpointDragging: midpointDragState !== null,
        handleMidpointMouseDown,
        handleMidpointDragMouseMove,
        handleMidpointDragEnd,
    };
}
