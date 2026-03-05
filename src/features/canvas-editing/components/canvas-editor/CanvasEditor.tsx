import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "react-konva";
import type Konva from "konva";
import type { Object, Vertex } from "@/types/schemaTypes";
import { sameObject } from "@/features/canvas-editing/utils/canvasObjectUtils";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { beginBatch, endBatch } from "@/features/canvas-editing/stores/canvasHistoryStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useCanvasSize } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasSize";
import { objectVertices } from "@/features/canvas-editing/utils/canvasGeometry";
import { useCanvasPanning } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasPanning";
import { useCanvasZoom } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasZoom";
import { useCanvasDrawing } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasDrawing";
import { useCanvasMidpointDrag } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasMidpointDrag";
import { useCanvasVertexDrag } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasVertexDrag";
import { useCanvasKeyboard } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasKeyboard";
import { useCanvasAutosave } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasSave";
import { CanvasGridLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasGridLayer";
import { CanvasPolygonObjectsLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasPolygonObjectsLayer";
import { CanvasVertexHandlesLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasVertexHandlesLayer";
import { CanvasDrawingPreviewLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasDrawingPreviewLayer";

export default function CanvasEditor() {
  const stageRef = useRef<Konva.Stage>(null);
  const [draggingVertex, setDraggingVertex] = useState<Vertex | null>(null);
  const [movingObject, setMovingObject] = useState<Object | null>(null);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const [isHoveringObject, setIsHoveringObject] = useState<Object | null>(null);

  const { position, scale, gridVisible, setPosition, setScale } = useCanvasViewStore();
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const {
    objects,
    vertices,
    addObject,
    deleteObject,
    updateVertex,
    moveObject,
    deleteVertex,
    deleteVertices,
    insertVertex,
  } = useCanvasObjectStore();

  const {
    selectedObject: selectedStoreObject,
    selectedVertices,
    selectObject,
    clearSelection,
    selectVertex,
    toggleVertexSelection,
  } = useCanvasSelectionStore();

  const { containerRef, size } = useCanvasSize();

  const {
    isPanning,
    isPanningRef,
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

  const { handleVertexDragMove, handleVertexDragEnd } = useCanvasVertexDrag(updateVertex);

  useCanvasAutosave();

  const { handleKeyDown } = useCanvasKeyboard({
    activeTool,
    drawingPointsCount: drawingPoints.length,
    selectedObject: selectedStoreObject,
    selectedVertices,
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
    activeTool === "select" && selectedStoreObject &&
    !(movingObject !== null && sameObject(movingObject, selectedStoreObject))
      ? selectedStoreObject
      : null;

  const selectedObjectVertices = selectedObject
    ? objectVertices(vertices, selectedObject.id)
    : [];

  const isDrawing = activeTool === "addZone" || activeTool === "addObstacle";

  function resolveCursor() {
    if (isPanning) return "grabbing";
    if (movingObject !== null) return "grabbing";
    if (isMidpointDragging || isHoveringHandle || draggingVertex !== null || isDrawing) return "crosshair";
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
          vertices={vertices}
          selectedObject={selectedStoreObject}
          movingObject={movingObject}
          activeTool={activeTool}
          scale={scale}
          isPanningRef={isPanningRef}
          onSelectObject={selectObject}
          onDeleteObject={(obj) => {
            deleteObject(obj);
            if (selectedStoreObject?.id === obj.id) clearSelection();
          }}
          onObjectHoverChange={setIsHoveringObject}
          onObjectDragStart={(obj) => {
            if (obj.id !== selectedStoreObject?.id) {
              clearSelection();
              selectObject(obj);
            } else {
              selectVertex(null);
            }
            setMovingObject(obj);
          }}
          onObjectDragEnd={(obj, dx, dy) => {
            moveObject(obj, dx, dy);
            setMovingObject(null);
          }}
        />

        <CanvasVertexHandlesLayer
          selectedObject={selectedObject}
          selectedObjectVertices={selectedObjectVertices}
          activeTool={activeTool}
          scale={scale}
          selectedVertices={selectedVertices}
          draggingVertex={draggingVertex}
          onVertexClick={(v, ctrl) => toggleVertexSelection(v, ctrl)}
          onVertexDragStart={(v) => {
            setDraggingVertex(v);
            beginBatch();
          }}
          onVertexDragMove={handleVertexDragMove}
          onVertexDragEnd={(vertex, pos) => {
            setDraggingVertex(null);
            handleVertexDragEnd(vertex, pos);
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