import React from "react";
import { useUIState, useCanvasData } from "../store/workspaceStore";

/**
 * StatusBar Component
 * Displays workspace information and legend
 */
export function StatusBar() {
  const { activeTool, testMode, gridVisible } = useUIState();
  const { zones, obstacles, paths } = useCanvasData();

  return (
    <div
      className="flex items-center justify-between"
      style={{
        height: "1.75rem",
        backgroundColor: "var(--color-bg-secondary)",
        borderTop: "1px solid var(--color-border)",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        fontSize: "0.75rem",
        color: "var(--color-text-secondary)",
      }}
    >
      {/* Left: Status info */}
      <div className="flex items-center gap-4">
        <span>
          Tool: <span className="text-[var(--color-accent)]">{activeTool}</span>
        </span>
        <span>{testMode ? "Test Mode" : "Normal Mode"}</span>
        <span>{gridVisible ? "Grid: ON" : "Grid: OFF"}</span>
      </div>

      {/* Center: Legend */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 border"
            style={{ borderColor: "var(--color-accent)" }}
          />
          <span>{zones.length} Zone(s)</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 border"
            style={{ borderColor: "var(--color-obstacle)" }}
          />
          <span>{obstacles.length} Obstacle(s)</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 border"
            style={{ borderColor: "var(--color-path)" }}
          />
          <span>{paths.length} Path(s)</span>
        </div>
      </div>

      {/* Right: Zoom and info */}
      <div className="flex items-center gap-2">
        <span>Zoom: 100%</span>
        <span>|</span>
        <span>Ready</span>
      </div>
    </div>
  );
}
