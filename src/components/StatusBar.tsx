import React from "react";
import { useUIState, useCanvasData } from "../stores/workspace/workspaceStore";

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
        height: "1.875rem",
        backgroundColor: "var(--color-bg-secondary)",
        borderTop: "1px solid var(--color-border)",
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        fontSize: "0.8125rem",
        color: "var(--color-text-secondary)",
      }}
    >
      {/* Left: Status info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--color-text-tertiary)]">Tool:</span>
          <span className="text-[var(--color-text-primary)] font-medium">{activeTool}</span>
        </div>
        <div className="w-px h-3.5 bg-[var(--color-border)]" />
        <span className={testMode ? "text-[var(--color-test-mode)] font-medium" : "text-[var(--color-text-secondary)]"}>
          {testMode ? "●" : "○"} {testMode ? "Test Mode" : "Normal Mode"}
        </span>
        <div className="w-px h-3.5 bg-[var(--color-border)]" />
        <span className={gridVisible ? "text-[var(--color-accent)] font-medium" : "text-[var(--color-text-secondary)]"}>
          Grid: {gridVisible ? "ON" : "OFF"}
        </span>
      </div>

      {/* Center: Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 border-2 rounded-sm"
            style={{ borderColor: "var(--color-accent)" }}
          />
          <span className="text-[var(--color-text-secondary)]">{zones.length}</span>
          <span className="text-[var(--color-text-tertiary)] text-[0.75rem]">Zone{zones.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 border-2 rounded-sm"
            style={{ borderColor: "var(--color-obstacle)" }}
          />
          <span className="text-[var(--color-text-secondary)]">{obstacles.length}</span>
          <span className="text-[var(--color-text-tertiary)] text-[0.75rem]">Obstacle{obstacles.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 border-2 rounded-sm"
            style={{ borderColor: "var(--color-path)" }}
          />
          <span className="text-[var(--color-text-secondary)]">{paths.length}</span>
          <span className="text-[var(--color-text-tertiary)] text-[0.75rem]">Path{paths.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Right: Zoom and info */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--color-text-secondary)]">Zoom: 100%</span>
        <div className="w-px h-3.5 bg-[var(--color-border)]" />
        <span className="text-[var(--color-accent)] font-medium">Ready</span>
      </div>
    </div>
  );
}
