import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Circle } from "react-konva";
import type Konva from "konva";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";

const GRID_SPACING = 40;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 8;
const ZOOM_FACTOR = 1.15;

export default function CanvasEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Panning state — refs to avoid spurious re-renders during fast mouse moves
  const isPanningRef = useRef(false);
  const panLastPosRef = useRef({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false); // for cursor only

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

  // ─── Grid lines ───────────────────────────────────────────────────
  const gridLines = (() => {
    if (!gridVisible || size.width === 0) return null;

    const worldLeft = -position.x / scale;
    const worldTop = -position.y / scale;
    const worldRight = (size.width - position.x) / scale;
    const worldBottom = (size.height - position.y) / scale;

    const startX = Math.floor(worldLeft / GRID_SPACING) * GRID_SPACING;
    const startY = Math.floor(worldTop / GRID_SPACING) * GRID_SPACING;

    const lines = [];
    for (let x = startX; x <= worldRight + GRID_SPACING; x += GRID_SPACING) {
      lines.push(
        <Line
          key={`gv-${x}`}
          points={[x, worldTop - GRID_SPACING, x, worldBottom + GRID_SPACING]}
          stroke="#e2e8f0"
          strokeWidth={1 / scale}
          listening={false}
        />,
      );
    }
    for (let y = startY; y <= worldBottom + GRID_SPACING; y += GRID_SPACING) {
      lines.push(
        <Line
          key={`gh-${y}`}
          points={[worldLeft - GRID_SPACING, y, worldRight + GRID_SPACING, y]}
          stroke="#e2e8f0"
          strokeWidth={1 / scale}
          listening={false}
        />,
      );
    }
    return lines;
  })();

  // ─── Derived: selected object ─────────────────────────────────────
  const selectedObject =
    activeTool === "select" && selectedObjectId
      ? (objects.find((o) => o.id === selectedObjectId) ?? null)
      : null;

  const isDrawing = activeTool === "addZone" || activeTool === "addObstacle";
  const drawColor = activeTool === "addZone" ? "#3b82f6" : "#ef4444";

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-white overflow-hidden outline-none"
      style={{
        cursor: isPanning ? "grabbing" : isDrawing ? "crosshair" : "default",
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      // Prevent native context menu on right-click anywhere in the canvas
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
        {/* ── Layer 1: Grid ───────────────────────────────────────── */}
        <Layer listening={false}>{gridLines}</Layer>

        {/* ── Layer 2: Polygon objects ────────────────────────────── */}
        <Layer>
          {objects.map((obj) => {
            const isZone = obj.category === "zone";
            const isSelected = obj.id === selectedObjectId;
            const canInteract =
              activeTool === "select" || activeTool === "delete";
            return (
              <Line
                key={obj.id}
                points={obj.vertices.flatMap((v) => [v.x, v.y])}
                closed
                fill={isZone ? "rgba(59,130,246,0.18)" : "rgba(239,68,68,0.18)"}
                stroke={isZone ? "#3b82f6" : "#ef4444"}
                strokeWidth={(isSelected ? 2.5 : 1.5) / scale}
                listening={canInteract}
                hitStrokeWidth={8 / scale}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (activeTool === "delete") {
                    deleteObject(obj.id);
                  } else if (activeTool === "select") {
                    selectObject(obj.id);
                  }
                }}
              />
            );
          })}
        </Layer>

        {/* ── Layer 3: Vertex + edge-midpoint handles (select mode) ── */}
        <Layer listening={activeTool === "select" && selectedObject !== null}>
          {selectedObject?.vertices.map((v, i) => {
            const nextI = (i + 1) % selectedObject.vertices.length;
            const next = selectedObject.vertices[nextI];
            if (!next) return null;
            const midX = (v.x + next.x) / 2;
            const midY = (v.y + next.y) / 2;
            const accentColor =
              selectedObject.category === "zone" ? "#3b82f6" : "#ef4444";

            return [
              // Vertex handle
              <Circle
                key={`vh-${v.id}`}
                x={v.x}
                y={v.y}
                radius={6 / scale}
                fill={selectedVertexIndex === i ? "#f59e0b" : "#ffffff"}
                stroke={selectedVertexIndex === i ? "#d97706" : accentColor}
                strokeWidth={2 / scale}
                draggable
                onClick={(e) => {
                  e.cancelBubble = true;
                  selectVertex(selectedVertexIndex === i ? null : i);
                }}
                onDragMove={(e) => {
                  updateVertex(
                    selectedObject.id,
                    i,
                    e.target.x(),
                    e.target.y(),
                  );
                }}
                onDragEnd={(e) => {
                  updateVertex(
                    selectedObject.id,
                    i,
                    e.target.x(),
                    e.target.y(),
                  );
                }}
              />,

              // Edge midpoint handle — drag inserts a new vertex splitting the edge
              <Circle
                key={`em-${v.id}`}
                x={midX}
                y={midY}
                radius={4 / scale}
                fill="rgba(255,255,255,0.8)"
                stroke="#94a3b8"
                strokeWidth={1.5 / scale}
                draggable
                onDragStart={() => {
                  // Immediately insert a vertex at the midpoint; drag continues to move it
                  insertVertex(selectedObject.id, i, midX, midY);
                }}
                onDragMove={(e) => {
                  // New vertex sits at index i+1 after insertion
                  updateVertex(
                    selectedObject.id,
                    i + 1,
                    e.target.x(),
                    e.target.y(),
                  );
                }}
                onDragEnd={(e) => {
                  updateVertex(
                    selectedObject.id,
                    i + 1,
                    e.target.x(),
                    e.target.y(),
                  );
                }}
              />,
            ];
          })}
        </Layer>

        {/* ── Layer 4: Drawing preview ────────────────────────────── */}
        <Layer listening={false}>
          {isDrawing && drawingPoints.length > 0 && (
            <>
              {/* Placed vertices line */}
              <Line
                points={drawingPoints.flatMap((p) => [p.x, p.y])}
                stroke={drawColor}
                strokeWidth={2 / scale}
                closed={false}
                dash={[6 / scale, 3 / scale]}
              />

              {/* Live preview edge (last point → cursor) */}
              {mousePos &&
                (() => {
                  const lastPt = drawingPoints[drawingPoints.length - 1];
                  if (!lastPt) return null;
                  return (
                    <Line
                      points={[lastPt.x, lastPt.y, mousePos.x, mousePos.y]}
                      stroke={activeTool === "addZone" ? "#93c5fd" : "#fca5a5"}
                      strokeWidth={1.5 / scale}
                      dash={[4 / scale, 4 / scale]}
                    />
                  );
                })()}

              {/* Vertex dots */}
              {drawingPoints.map((p, idx) => (
                <Circle
                  key={`dp-${idx}`}
                  x={p.x}
                  y={p.y}
                  radius={4 / scale}
                  fill={drawColor}
                />
              ))}
            </>
          )}
        </Layer>
      </Stage>
    </div>
  );
}
