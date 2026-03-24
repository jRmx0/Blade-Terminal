import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";
import { useCanvasPanning } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasPanning";
import { useCanvasZoom } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasZoom";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID } from "@/config/layers/layerRegistry";
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

  const scale = useCanvasViewStore((s) => s.scale);
  const setPosition = useCanvasViewStore((s) => s.setPosition);
  const setScale = useCanvasViewStore((s) => s.setScale);
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const layerSettings = useLayerSettingsStore((s) => s.layers);
  const {
    objects,
    vertices,
    addObject,
    deleteObject,
    moveVertexXY,
    finalizeVertexMove,
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
    handleDragMove,
    handleDragEnd,
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
  } = useCanvasMidpointDrag({ stageRef, insertVertex, moveVertexXY, finalizeVertexMove, selectVertex });

  const { handleVertexDragMove, handleVertexDragEnd } = useCanvasVertexDrag(moveVertexXY, finalizeVertexMove);

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

  // Compose mouse move: drawing preview + midpoint drag
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      updateDrawingMousePosition(e);
      handleMidpointDragMouseMove(e);
    },
    [updateDrawingMousePosition, handleMidpointDragMouseMove],
  );

  // Compose mouse up: midpoint drag
  const handleMouseUp = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      handleMidpointDragEnd();
    },
    [handleMidpointDragEnd],
  );

  // Compose mouse leave: drawing preview + midpoint drag
  const handleMouseLeave = useCallback(() => {
    clearDrawingMousePosition();
    handleMidpointDragEnd();
  }, [clearDrawingMousePosition, handleMidpointDragEnd]);

  const selectedObject =
    activeTool === "select" && selectedStoreObject &&
      !(movingObject !== null && sameObject(movingObject, selectedStoreObject))
      ? selectedStoreObject
      : null;

  // Suppress vertex handles when the selected object's layer is hidden.
  const zonesVisible = getLayerParam(layerSettings, LAYER_ID.ZONES, "Visible") !== "false";
  const obstaclesVisible = getLayerParam(layerSettings, LAYER_ID.OBSTACLES, "Visible") !== "false";
  const gridZIndex = parseInt(getLayerParam(layerSettings, LAYER_ID.GRID, "Z-Index") ?? "10", 10);
  const zoneZIndex = parseInt(getLayerParam(layerSettings, LAYER_ID.ZONES, "Z-Index") ?? "20", 10);
  const obstacleZIndex = parseInt(getLayerParam(layerSettings, LAYER_ID.OBSTACLES, "Z-Index") ?? "30", 10);
  // Grid renders above the polygon layer when its Z-Index exceeds the lowest polygon Z-Index.
  const gridAbovePolygons = gridZIndex >= Math.min(zoneZIndex, obstacleZIndex);
  const selectedObjectForHandles =
    selectedObject === null ? null :
      selectedObject.category === "zone" ? (zonesVisible ? selectedObject : null) :
        obstaclesVisible ? selectedObject : null;

  const selectedObjectVertices = useMemo(
    () => (selectedObjectForHandles ? objectVertices(vertices, selectedObjectForHandles.id) : []),
    [selectedObjectForHandles, vertices],
  );

  const isDrawing = activeTool === "addZone" || activeTool === "addObstacle";

  const handleDeleteObject = useCallback(
    (obj: Object) => {
      deleteObject(obj);
      if (selectedStoreObject?.id === obj.id) clearSelection();
    },
    [deleteObject, selectedStoreObject?.id, clearSelection],
  );

  const handleObjectDragStart = useCallback(
    (obj: Object) => {
      if (obj.id !== selectedStoreObject?.id) {
        clearSelection();
        selectObject(obj);
      } else {
        selectVertex(null);
      }
      setMovingObject(obj);
    },
    [selectedStoreObject?.id, clearSelection, selectObject, selectVertex],
  );

  const handleObjectDragEnd = useCallback(
    (obj: Object, dx: number, dy: number) => {
      moveObject(obj, dx, dy);
      setMovingObject(null);
    },
    [moveObject],
  );

  const handleVertexClick = useCallback(
    (v: Vertex, ctrl: boolean) => toggleVertexSelection(v, ctrl),
    [toggleVertexSelection],
  );

  const handleVertexDragStart = useCallback((v: Vertex) => {
    setDraggingVertex(v);
    beginBatch();
  }, []);

  const handleVertexDragEndCb = useCallback(
    (vertex: Vertex, pos: Point) => {
      setDraggingVertex(null);
      handleVertexDragEnd(vertex, pos);
      endBatch();
    },
    [handleVertexDragEnd],
  );

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
        x={useCanvasViewStore.getState().position.x}
        y={useCanvasViewStore.getState().position.y}
        scaleX={scale}
        scaleY={scale}
        draggable={false}
        onMouseDown={handlePanMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleStageClick}
        onContextMenu={handlePolygonClose}
        onWheel={handleWheel}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {!gridAbovePolygons && <CanvasGridLayer width={size.width} height={size.height} />}

        <CanvasPolygonObjectsLayer
          objects={objects}
          vertices={vertices}
          selectedObject={selectedStoreObject}
          movingObject={movingObject}
          activeTool={activeTool}
          scale={scale}
          isPanningRef={isPanningRef}
          onSelectObject={selectObject}
          onDeleteObject={handleDeleteObject}
          onObjectHoverChange={setIsHoveringObject}
          onObjectDragStart={handleObjectDragStart}
          onObjectDragEnd={handleObjectDragEnd}
        />

        {gridAbovePolygons && <CanvasGridLayer width={size.width} height={size.height} />}

        <CanvasVertexHandlesLayer
          selectedObject={selectedObjectForHandles}
          selectedObjectVertices={selectedObjectVertices}
          activeTool={activeTool}
          scale={scale}
          selectedVertices={selectedVertices}
          draggingVertex={draggingVertex}
          onVertexClick={handleVertexClick}
          onVertexDragStart={handleVertexDragStart}
          onVertexDragMove={handleVertexDragMove}
          onVertexDragEnd={handleVertexDragEndCb}
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