import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "react-konva";
import type Konva from "konva";
import type { Object } from "@/types/schemaTypes";
import type { VertexRef } from "@/features/canvas-editing/types/canvas";
import { sameObject } from "@/features/canvas-editing/utils/canvasObjectUtils";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { beginBatch, endBatch } from "@/features/canvas-editing/stores/canvasHistoryStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useCanvasSize } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasSize";
import type { Point } from "@/features/canvas-editing/utils/canvasGeometry";
import { useCanvasPanning } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasPanning";
import { useCanvasZoom } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasZoom";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID, LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
import { OBJECT_CATEGORY } from "@/config/db-ops/enums";
import { useCanvasDrawing } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasDrawing";
import { useCanvasMidpointDrag } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasMidpointDrag";
import { useCanvasVertexDrag } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasVertexDrag";
import { useCanvasKeyboard } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasKeyboard";
import { useCanvasAutosave } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasSave";
import { CanvasGridLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasGridLayer";
import { CanvasPolygonObjectsLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasPolygonObjectsLayer";
import { CanvasVertexHandlesLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasVertexHandlesLayer";
import { CanvasDrawingPreviewLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasDrawingPreviewLayer";
import { CanvasDynamicLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasDynamicLayer";
import { CanvasEnvPointsLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasEnvPointsLayer";
import { useEnvPointStore } from "@/stores/envPointStore";
import { useEnvStore } from "@/stores/envStore";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import { useProviderLayerStore } from "@/stores/providerLayerStore";
import { extractLayerData, getProviderLayersForResult } from "@/features/canvas-editing/utils/layerDataUtils";

export default function CanvasEditor() {
  const stageRef = useRef<Konva.Stage>(null);
  const [draggingVertexRef, setDraggingVertexRef] = useState<VertexRef | null>(null);
  const [movingObject, setMovingObject] = useState<Object | null>(null);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const [isHoveringEnvPoint, setIsHoveringEnvPoint] = useState(false);
  const [isHoveringObject, setIsHoveringObject] = useState<Object | null>(null);
  const centeredRef = useRef(false);

  const scale = useCanvasViewStore((s) => s.scale);
  const position = useCanvasViewStore((s) => s.position);
  const setPosition = useCanvasViewStore((s) => s.setPosition);
  const setScale = useCanvasViewStore((s) => s.setScale);
  const setCanvasSize = useCanvasViewStore((s) => s.setCanvasSize);
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const layerSettings = useLayerSettingsStore((s) => s.layers);
  const result = useComputeResultStore((s) => s.result);
  const providerLayers = useProviderLayerStore((s) => s.layers);
  const {
    objects,
    addObject,
    deleteObject,
    moveVertexAt,
    finalizeVertexMoveAt,
    moveObject,
    deleteVertex,
    deleteVertices,
    insertVertex,
  } = useCanvasObjectStore();

  const {
    selectedObject: selectedStoreObject,
    selectedVertexRefs,
    selectedEnvPointType,
    selectObject,
    clearSelection,
    selectVertex,
    toggleVertexSelection,
  } = useCanvasSelectionStore();

  const deletePoint = useEnvPointStore((s) => s.deletePoint);
  const envId = useEnvStore((s) => s.env.id);

  const { containerRef, size } = useCanvasSize();

  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      setCanvasSize(size.width, size.height);
      if (!centeredRef.current) {
        centeredRef.current = true;
        setPosition({ x: size.width / 2, y: size.height / 2 });
      }
    }
  }, [size.width, size.height]);

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
  } = useCanvasMidpointDrag({ stageRef, insertVertex, moveVertexAt, finalizeVertexMoveAt, selectVertex });

  const { handleVertexDragMove, handleVertexDragEnd } = useCanvasVertexDrag(moveVertexAt, finalizeVertexMoveAt);

  useCanvasAutosave();

  const { handleKeyDown } = useCanvasKeyboard({
    activeTool,
    drawingPointsCount: drawingPoints.length,
    selectedObject: selectedStoreObject,
    selectedVertexRefs,
    selectedEnvPointType,
    envPointEnvironmentId: envId,
    setActiveTool,
    clearSelection,
    selectVertex,
    deleteObject,
    deleteVertex,
    deleteVertices,
    deleteEnvPoint: deletePoint,
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
  const zonesVisible = getLayerParam(layerSettings, LAYER_ID.ZONES, LAYER_PARAM_KEY.VISIBLE) !== "false";
  const obstaclesVisible = getLayerParam(layerSettings, LAYER_ID.OBSTACLES, LAYER_PARAM_KEY.VISIBLE) !== "false";
  const gridZIndex = parseInt(getLayerParam(layerSettings, LAYER_ID.GRID, LAYER_PARAM_KEY.Z_INDEX) ?? "10", 10);
  const zoneZIndex = parseInt(getLayerParam(layerSettings, LAYER_ID.ZONES, LAYER_PARAM_KEY.Z_INDEX) ?? "20", 10);
  const obstacleZIndex = parseInt(getLayerParam(layerSettings, LAYER_ID.OBSTACLES, LAYER_PARAM_KEY.Z_INDEX) ?? "30", 10);
  const envPointsZIndex = parseInt(getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.Z_INDEX) ?? "40", 10);

  // Memoize provider layers active for the current compute result.
  const activeProviderLayers = useMemo(
    () => (result ? getProviderLayersForResult(result, providerLayers) : []),
    [result, providerLayers],
  );

  // Build per-layer entries for each active provider layer: settings + extracted items.
  const dynamicEntries = useMemo(() => {
    if (!result) return [];
    return activeProviderLayers.map((pl) => {
      const lws = layerSettings.find(
        (l) => l.layer.id === pl.id && l.layer.algorithmId === pl.algorithmId && l.layer.providerId === pl.providerId,
      );
      const zIndex = lws
        ? parseInt(lws.settings.find((s) => s.key === "Z-Index")?.value ?? "50", 10)
        : 50;
      return {
        kind: "dynamic" as const,
        providerLayer: pl,
        settings: lws?.settings ?? [],
        items: extractLayerData(result.result, pl.computeLayer),
        zIndex,
      };
    });
  }, [result, activeProviderLayers, layerSettings]);

  // Unified layer order — system and dynamic layers interleaved by Z-Index ascending.
  const allLayerOrder = [
    { kind: "system" as const, id: "grid" as const, zIndex: gridZIndex },
    { kind: "system" as const, id: "zones" as const, zIndex: zoneZIndex },
    { kind: "system" as const, id: "obstacles" as const, zIndex: obstacleZIndex },
    { kind: "system" as const, id: "envPoints" as const, zIndex: envPointsZIndex },
    ...dynamicEntries,
  ].sort((a, b) => a.zIndex - b.zIndex);

  const selectedObjectForHandles =
    selectedObject === null ? null :
      selectedObject.category === OBJECT_CATEGORY.ZONE ? (zonesVisible ? selectedObject : null) :
        obstaclesVisible ? selectedObject : null;

  const selectedObjectVertices = useMemo(() => {
    if (!selectedObjectForHandles) return [];
    const live = objects.find((o) => o.id === selectedObjectForHandles.id);
    return live?.vertices ?? [];
  }, [selectedObjectForHandles, objects]);

  const isDrawing = activeTool === "addZone" || activeTool === "addObstacle";
  const isPlacingPoint = activeTool === "addStartPoint" || activeTool === "addEndPoint" || activeTool === "addStartEndPoint";

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
    (ref: VertexRef, ctrl: boolean) => toggleVertexSelection(ref, ctrl),
    [toggleVertexSelection],
  );

  const handleVertexDragStart = useCallback((ref: VertexRef) => {
    setDraggingVertexRef(ref);
    beginBatch();
  }, []);

  const handleVertexDragEndCb = useCallback(
    (ref: VertexRef, pos: Point) => {
      setDraggingVertexRef(null);
      handleVertexDragEnd(ref, pos);
      selectVertex(null); // winding correction may reverse array; clear stale index
      endBatch();
    },
    [handleVertexDragEnd, selectVertex],
  );

  function resolveCursor() {
    if (isPanning) return "grabbing";
    if (movingObject !== null) return "grabbing";
    if (isMidpointDragging || isHoveringHandle || isHoveringEnvPoint || draggingVertexRef !== null || isDrawing || isPlacingPoint) return "crosshair";
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
        {allLayerOrder.map((entry) => {
          if (entry.kind === "dynamic") {
            return (
              <CanvasDynamicLayer
                key={`dyn-${entry.providerLayer.algorithmId}-${entry.providerLayer.providerId}-${entry.providerLayer.id}`}
                layerMeta={entry.providerLayer}
                settings={entry.settings}
                items={entry.items}
              />
            );
          }
          if (entry.id === "grid") {
            return <CanvasGridLayer key="grid" width={size.width} height={size.height} />;
          }
          if (entry.id === "zones") {
            return (
              <CanvasPolygonObjectsLayer
                key="zones"
                category={OBJECT_CATEGORY.ZONE}
                objects={objects}
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
            );
          }
          if (entry.id === "obstacles") {
            return (
              <CanvasPolygonObjectsLayer
                key="obstacles"
                category={OBJECT_CATEGORY.OBSTACLE}
                objects={objects}
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
            );
          }
          if (entry.id === "envPoints") {
            return <CanvasEnvPointsLayer key="envPoints" onEnvPointHoverChange={setIsHoveringEnvPoint} />;
          }
          return null;
        })}

        <CanvasVertexHandlesLayer
          selectedObject={selectedObjectForHandles}
          selectedObjectVertices={selectedObjectVertices}
          activeTool={activeTool}
          scale={scale}
          selectedVertexRefs={selectedVertexRefs}
          draggingVertexRef={draggingVertexRef}
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