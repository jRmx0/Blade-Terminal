import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "react-konva";
import type Konva from "konva";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { beginBatch, endBatch } from "@/features/canvas-editing/stores/canvasHistoryStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useCanvasSize } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasSize";
import { useCanvasPanning } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasPanning";
import { useCanvasZoom } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasZoom";
import { useCanvasDrawing } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasDrawing";
import { useCanvasMidpointDrag } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasMidpointDrag";
import { useCanvasKeyboard } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasKeyboard";
import { CanvasGridLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasGridLayer";
import { CanvasPolygonObjectsLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasPolygonObjectsLayer";
import { CanvasVertexHandlesLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasVertexHandlesLayer";
import { CanvasDrawingPreviewLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasDrawingPreviewLayer";

export default function CanvasEditor() {
  const stageRef = useRef<Konva.Stage>(null);
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(null);
  const [movingObjectId, setMovingObjectId] = useState<string | null>(null);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const [isHoveringObject, setIsHoveringObject] = useState<string | null>(null);

  const { position, scale, gridVisible, setPosition, setScale } = useCanvasViewStore();
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const {
    objects,
    addObject,
    deleteObject,
    updateVertex,
    moveObject,
    deleteVertex,
    deleteVertices,
    insertVertex,
  } = useCanvasObjectStore();

  const {
    selectedObjectId,
    selectedVertexIndices,
    selectObject,
    clearSelection,
    selectVertex,
    toggleVertexSelection,
  } = useCanvasSelectionStore();

  const { containerRef, size } = useCanvasSize();

  const {
    isPanning,
    handlePanMouseDown,
    handlePanMouseMove,
    handlePanMouseUp,
    handlePanMouseLeave,
  } = useCanvasPanning(stageRef, setPosition);

  const { handleWheel } = useCanvasZoom(stageRef, setScale, setPosition);

  const {
    drawingPoints,
    mousePos,
    updateDrawingMousePosition,
    clearDrawingMousePosition,
    handleStageClick,
    handlePolygonClose,
    cancelDrawing,
  } = useCanvasDrawing({ activeTool, stageRef, clearSelection, addObject });

  const {
    isMidpointDragging,
    handleMidpointMouseDown,
    handleMidpointDragMouseMove,
    handleMidpointDragEnd,
  } = useCanvasMidpointDrag({ stageRef, insertVertex, updateVertex, selectVertex });

  const { handleKeyDown } = useCanvasKeyboard({
    activeTool,
    drawingPointsCount: drawingPoints.length,
    selectedObjectId,
    selectedVertexIndices,
    setActiveTool,
    clearSelection,
    selectVertex,
    deleteObject,
    deleteVertex,
    deleteVertices,
    cancelDrawing,
  });

  // Keep canvas focusable for keyboard events
  useEffect(() => {
    containerRef.current?.focus();
  }, [activeTool, containerRef]);

  // Compose mouse move: panning + drawing preview + midpoint drag
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      handlePanMouseMove(e);
      updateDrawingMousePosition(e);
      handleMidpointDragMouseMove(e);
    },
    [handlePanMouseMove, updateDrawingMousePosition, handleMidpointDragMouseMove],
  );

  // Compose mouse up: panning + midpoint drag
  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      handlePanMouseUp(e);
      handleMidpointDragEnd();
    },
    [handlePanMouseUp, handleMidpointDragEnd],
  );

  // Compose mouse leave: panning + drawing preview + midpoint drag
  const handleMouseLeave = useCallback(() => {
    handlePanMouseLeave();
    clearDrawingMousePosition();
    handleMidpointDragEnd();
  }, [handlePanMouseLeave, clearDrawingMousePosition, handleMidpointDragEnd]);

  const selectedObject =
    activeTool === "select" && selectedObjectId && movingObjectId !== selectedObjectId
      ? (objects.find((o) => o.id === selectedObjectId) ?? null)
      : null;

  const isDrawing = activeTool === "addZone" || activeTool === "addObstacle";

  function resolveCursor() {
    if (isPanning) return "grabbing";
    if (movingObjectId !== null) return "grabbing";
    if (isMidpointDragging || isHoveringHandle || draggingVertexIndex !== null || isDrawing) return "crosshair";
    if (isHoveringObject !== null && activeTool === "select") return "move";
    if (isHoveringObject && activeTool === "delete") return "crosshair";
    return "default";
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-white overflow-hidden outline-none"
      style={{ cursor: resolveCursor() }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handlePanMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleStageClick}
        onContextMenu={handlePolygonClose}
        onWheel={handleWheel}
      >
        {gridVisible && (
          <CanvasGridLayer position={position} scale={scale} size={size} />
        )}

        <CanvasPolygonObjectsLayer
          objects={objects}
          selectedObjectId={selectedObjectId}
          movingObjectId={movingObjectId}
          activeTool={activeTool}
          scale={scale}
          onSelectObject={selectObject}
          onDeleteObject={(id) => {
            deleteObject(id);
            if (selectedObjectId === id) clearSelection();
          }}
          onObjectHoverChange={setIsHoveringObject}
          onObjectDragStart={(id) => {
            if (id !== selectedObjectId) {
              clearSelection();
              selectObject(id);
            } else {
              selectVertex(null);
            }
            setMovingObjectId(id);
          }}
          onObjectDragEnd={(id, dx, dy) => {
            moveObject(id, dx, dy);
            setMovingObjectId(null);
          }}
        />

        <CanvasVertexHandlesLayer
          selectedObject={selectedObject}
          activeTool={activeTool}
          scale={scale}
          selectedVertexIndices={selectedVertexIndices}
          draggingVertexIndex={draggingVertexIndex}
          onVertexClick={(i, ctrl) => toggleVertexSelection(i, ctrl)}
          onVertexDragStart={(i) => {
            setDraggingVertexIndex(i);
            beginBatch();
          }}
          onVertexDragMove={(objectId, i, x, y) => updateVertex(objectId, i, x, y)}
          onVertexDragEnd={(objectId, i, x, y) => {
            setDraggingVertexIndex(null);
            updateVertex(objectId, i, x, y);
            endBatch();
          }}
          onEdgeMidpointMouseDown={handleMidpointMouseDown}
          onHandleHoverChange={setIsHoveringHandle}
        />

        <CanvasDrawingPreviewLayer
          activeTool={activeTool}
          drawingPoints={drawingPoints}
          mousePos={mousePos}
          scale={scale}
        />
      </Stage>
    </div>
  );
}