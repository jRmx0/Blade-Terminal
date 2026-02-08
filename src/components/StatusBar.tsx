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
    <div className="flex items-center justify-between h-7 bg-zinc-800 border-t border-gray-700 px-5 text-[0.8125rem] text-gray-400">
      {/* Left: Status info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Tool:</span>
          <span className="text-gray-200 font-medium">{activeTool}</span>
        </div>
        <div className="w-px h-3.5 bg-gray-700" />
        <span
          className={testMode ? "text-amber-700 font-medium" : "text-gray-400"}
        >
          {testMode ? "●" : "○"} {testMode ? "Test Mode" : "Normal Mode"}
        </span>
        <div className="w-px h-3.5 bg-gray-700" />
        <span
          className={
            gridVisible ? "text-teal-600 font-medium" : "text-gray-400"
          }
        >
          Grid: {gridVisible ? "ON" : "OFF"}
        </span>
      </div>

      {/* Center: Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border-2 rounded-sm border-teal-600" />
          <span className="text-gray-400">{zones.length}</span>
          <span className="text-gray-500 text-[0.75rem]">
            Zone{zones.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border-2 rounded-sm border-red-500" />
          <span className="text-gray-400">{obstacles.length}</span>
          <span className="text-gray-500 text-[0.75rem]">
            Obstacle{obstacles.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border-2 rounded-sm border-green-500" />
          <span className="text-gray-400">{paths.length}</span>
          <span className="text-gray-500 text-[0.75rem]">
            Path{paths.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Right: Zoom and info */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Zoom: 100%</span>
        <div className="w-px h-3.5 bg-gray-700" />
        <span className="text-teal-600 font-medium">Ready</span>
      </div>
    </div>
  );
}
