import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "react-konva";
import type Konva from "konva";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_FACTOR } from "@/config/canvas-editing/canvasConfig";
import { CanvasGridLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasGridLayer";
import { CanvasPolygonObjectsLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasPolygonObjectsLayer";
import { CanvasVertexHandlesLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasVertexHandlesLayer";
import { CanvasDrawingPreviewLayer } from "@/features/canvas-editing/components/canvas-editor/layers/CanvasDrawingPreviewLayer";

export default function CanvasEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Panning state — refs to avoid spurious re-renders during fast mouse moves
  const isPanningRef = useRef(false);
  const panLastPosRef = useRef({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false); // for cursor only
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(null);

  const [size, setSize] = useState({ width: 0, height: 0 });

  // In-progress polygon vertices (drawing tools)
  const [drawingPoints, setDrawingPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Stores
  const { position, scale, gridVisible, setPosition, setScale } =
    useCanvasViewStore();
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const {
    objects,
    selectedObjectId,
    selectedVertexIndex,
    addObject,
    deleteObject,
    selectObject,
    clearSelection,
    selectVertex,
    updateVertex,
    deleteVertex,
    insertVertex,
  } = useCanvasObjectStore();

  // ─── Size tracking ────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keep canvas focusable for keyboard events
  useEffect(() => {
    containerRef.current?.focus();
  }, [activeTool]);

  // ─── Keyboard handling ────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (activeTool === "addZone" || activeTool === "addObstacle") {
          if (drawingPoints.length > 0) {
            // First ESC: dismiss in-progress polygon
            setDrawingPoints([]);
            setMousePos(null);
          } else {
            // Second (or first with no points) ESC: deactivate tool
            setActiveTool(null);
          }
        } else if (activeTool === "select") {
          if (selectedObjectId !== null || selectedVertexIndex !== null) {
            clearSelection();
          } else {
            setActiveTool(null);
          }
        } else if (activeTool === "delete") {
          setActiveTool(null);
        }
        return;
      }

      if (e.key === "Delete" && activeTool === "select") {
        if (selectedObjectId !== null && selectedVertexIndex !== null) {
          deleteVertex(selectedObjectId, selectedVertexIndex);
        }
      }
    },
    [
      activeTool,
      drawingPoints.length,
      selectedObjectId,
      selectedVertexIndex,
      setActiveTool,
      clearSelection,
      deleteVertex,
    ],
  );

  // ─── Pan: middle mouse button ─────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1) {
        e.evt.preventDefault();
        isPanningRef.current = true;
        setIsPanning(true);
        panLastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      }
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Panning — read store directly to avoid stale closure
      if (isPanningRef.current) {
        const dx = e.evt.clientX - panLastPosRef.current.x;
        const dy = e.evt.clientY - panLastPosRef.current.y;
        panLastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        const { position: cur } = useCanvasViewStore.getState();
        setPosition({ x: cur.x + dx, y: cur.y + dy });
      }

      // Drawing preview — track world-space mouse position
      if (activeTool === "addZone" || activeTool === "addObstacle") {
        const stage = stageRef.current;
        if (!stage) return;
        const ptr = stage.getRelativePointerPosition();
        if (ptr) setMousePos({ x: ptr.x, y: ptr.y });
      }
    },
    [activeTool, setPosition],
  );

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1) {
      isPanningRef.current = false;
      setIsPanning(false);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    isPanningRef.current = false;
    setIsPanning(false);
    setMousePos(null);
  }, []);

  // ─── Zoom: Alt + scroll ───────────────────────────────────────────
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      if (!e.evt.altKey) return;
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;
      const ptr = stage.getPointerPosition();
      if (!ptr) return;

      const { position: cur, scale: cur_scale } = useCanvasViewStore.getState();
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, cur_scale * Math.pow(ZOOM_FACTOR, direction)),
      );

      // Keep the point under the cursor fixed in world space
      const mouseWorldX = (ptr.x - cur.x) / cur_scale;
      const mouseWorldY = (ptr.y - cur.y) / cur_scale;
      setScale(newScale);
      setPosition({
        x: ptr.x - mouseWorldX * newScale,
        y: ptr.y - mouseWorldY * newScale,
      });
    },
    [setPosition, setScale],
  );

  // ─── Stage click ──────────────────────────────────────────────────
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button !== 0) return;

      if (activeTool === "addZone" || activeTool === "addObstacle") {
        const stage = stageRef.current;
        if (!stage) return;
        // Only place a point when clicking on empty canvas (not on a shape)
        if (e.target !== stage) return;
        const ptr = stage.getRelativePointerPosition();
        if (!ptr) return;
        setDrawingPoints((prev) => [...prev, { x: ptr.x, y: ptr.y }]);
        return;
      }

      // Select mode: click on empty canvas → deselect
      if (activeTool === "select" && e.target === stageRef.current) {
        clearSelection();
      }
    },
    [activeTool, clearSelection],
  );

  // ─── Right-click: close polygon ───────────────────────────────────
  const handleContextMenu = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      if (
        (activeTool === "addZone" || activeTool === "addObstacle") &&
        drawingPoints.length >= 3
      ) {
        addObject(
          activeTool === "addZone" ? "zone" : "obstacle",
          drawingPoints,
          "off-line",
        );
        setDrawingPoints([]);
        setMousePos(null);
        // Tool stays active — ready for next polygon immediately
      }
    },
    [activeTool, drawingPoints, addObject],
  );

  const selectedObject =
    activeTool === "select" && selectedObjectId
      ? (objects.find((o) => o.id === selectedObjectId) ?? null)
      : null;

  const isDrawing = activeTool === "addZone" || activeTool === "addObstacle";

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-white overflow-hidden outline-none"
      style={{ cursor: isPanning ? "grabbing" : isDrawing ? "crosshair" : "default" }}
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleStageClick}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      >
        {gridVisible && (
          <CanvasGridLayer position={position} scale={scale} size={size} />
        )}

        <CanvasPolygonObjectsLayer
          objects={objects}
          selectedObjectId={selectedObjectId}
          activeTool={activeTool}
          scale={scale}
          onSelectObject={selectObject}
          onDeleteObject={deleteObject}
        />

        <CanvasVertexHandlesLayer
          selectedObject={selectedObject}
          activeTool={activeTool}
          scale={scale}
          selectedVertexIndex={selectedVertexIndex}
          draggingVertexIndex={draggingVertexIndex}
          onVertexClick={(i) => selectVertex(selectedVertexIndex === i ? null : i)}
          onVertexDragStart={(i) => setDraggingVertexIndex(i)}
          onVertexDragMove={(objectId, i, x, y) => updateVertex(objectId, i, x, y)}
          onVertexDragEnd={(objectId, i, x, y) => {
            setDraggingVertexIndex(null);
            updateVertex(objectId, i, x, y);
          }}
          onEdgeMidpointDragStart={(objectId, afterIndex, midX, midY) =>
            insertVertex(objectId, afterIndex, midX, midY)
          }
          onEdgeMidpointDragMove={(objectId, afterIndex, x, y) =>
            updateVertex(objectId, afterIndex + 1, x, y)
          }
          onEdgeMidpointDragEnd={(objectId, afterIndex, x, y) =>
            updateVertex(objectId, afterIndex + 1, x, y)
          }
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
