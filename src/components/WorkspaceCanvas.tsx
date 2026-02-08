import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import {
  useCanvasData,
  useUIState,
  toKonvaPoints,
} from "../stores/workspace/workspaceStore";

/**
 * WorkspaceCanvas Component
 * Renders a responsive Konva canvas with placeholder zones, obstacles, and paths
 * - Fills available center pane space
 * - Dynamically adjusts to container size changes via ResizeObserver
 * - Renders grid, zones, obstacles, and paths with CAD-like styling
 */

// Canvas color constants
const CANVAS_BG = "#0f0f0f";
const CANVAS_GRID = "#2a2a2a";

export function WorkspaceCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const { zones, obstacles, paths } = useCanvasData();
  const { gridVisible } = useUIState();

  // Track container resize and update canvas dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setCanvasSize({
          width: clientWidth,
          height: clientHeight,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    // Set initial size
    const { clientWidth, clientHeight } = containerRef.current;
    setCanvasSize({
      width: clientWidth,
      height: clientHeight,
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Generate grid lines based on canvas size
  const gridSize = 20; // Grid cell size in pixels
  const gridLines = [];

  // Vertical lines
  for (let x = 0; x <= canvasSize.width; x += gridSize) {
    gridLines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, canvasSize.height]}
        stroke={CANVAS_GRID}
        strokeWidth={1}
        opacity={0.5}
      />,
    );
  }

  // Horizontal lines
  for (let y = 0; y <= canvasSize.height; y += gridSize) {
    gridLines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, canvasSize.width, y]}
        stroke={CANVAS_GRID}
        strokeWidth={1}
        opacity={0.5}
      />,
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: CANVAS_BG,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Stage width={canvasSize.width} height={canvasSize.height}>
        <Layer>
          {/* Canvas background rect */}
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fill={CANVAS_BG}
          />

          {/* Grid layer */}
          {gridVisible && gridLines}

          {/* Zones layer - semi-transparent colored rectangles */}
          {zones.map((zone) => (
            <React.Fragment key={zone.id}>
              {/* Zone rectangle with semi-transparent fill */}
              <Rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                fill={zone.color}
                opacity={0.25}
              />
              {/* Zone border */}
              <Rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                stroke={zone.color}
                strokeWidth={1}
              />
            </React.Fragment>
          ))}

          {/* Obstacles layer - colored rectangles */}
          {obstacles.map((obstacle) => (
            <React.Fragment key={obstacle.id}>
              {/* Obstacle rectangle */}
              <Rect
                x={obstacle.x}
                y={obstacle.y}
                width={obstacle.width}
                height={obstacle.height}
                fill={obstacle.color}
                opacity={0.6}
              />
              {/* Obstacle border */}
              <Rect
                x={obstacle.x}
                y={obstacle.y}
                width={obstacle.width}
                height={obstacle.height}
                stroke={obstacle.color}
                strokeWidth={2}
              />
            </React.Fragment>
          ))}

          {/* Paths layer - lines connecting waypoints */}
          {paths.map((path) => (
            <Line
              key={path.id}
              points={toKonvaPoints(path)}
              stroke={path.color}
              strokeWidth={path.strokeWidth}
              lineCap="round"
              lineJoin="round"
              tension={0.5}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
