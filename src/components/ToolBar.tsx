import React from "react";
import { useUIState, useUIActions } from "../stores/workspace/workspaceStore";
import type { Tool } from "../stores/workspace/workspaceStore";

interface ToolButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ label, isActive, onClick }: ToolButtonProps) {
  const baseClasses =
    "px-3 py-2 rounded font-medium text-sm flex items-center gap-2 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600";
  const activeClasses = isActive
    ? "bg-teal-600 text-zinc-900 shadow-md"
    : "text-gray-200 hover:bg-zinc-600 active:bg-gray-600";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses}`}
      title={label}
      aria-pressed={isActive}
    >
      <span
        className={`inline-block w-4 h-4 rounded transition-colors duration-150 ${
          isActive ? "bg-zinc-900 opacity-70" : "bg-gray-700"
        }`}
      />
      <span>{label}</span>
    </button>
  );
}

/**
 * ToolBar Component
 * Displays tool selection buttons and toggles for grid, measurements, and test mode
 */
export function ToolBar() {
  const { activeTool, gridVisible, measurementsVisible, testMode } =
    useUIState();
  const { setActiveTool, toggleGrid, toggleMeasurements, toggleTestMode } =
    useUIActions();

  const tools: Array<{ tool: Tool; label: string }> = [
    { tool: "select", label: "Select" },
    { tool: "zone", label: "Zone" },
    { tool: "obstacle", label: "Obstacle" },
    { tool: "path", label: "Path" },
    { tool: "measure", label: "Measure" },
  ];

  return (
    <div className="flex items-center justify-between h-12 bg-zinc-800 border-b border-gray-700 px-4 gap-4 overflow-x-auto">
      {/* Left: Tool buttons */}
      <div className="flex items-center gap-1 border-r border-gray-700 pr-4">
        {tools.map((t) => (
          <ToolButton
            key={t.tool}
            label={t.label}
            isActive={activeTool === t.tool}
            onClick={() => setActiveTool(t.tool)}
          />
        ))}
      </div>

      {/* Right: Toggle buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleGrid}
          className={`px-3 py-2 rounded font-medium text-xs transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ${
            gridVisible
              ? "bg-teal-600 text-zinc-900 shadow-md"
              : "text-gray-400 hover:text-gray-200 hover:bg-zinc-600 active:bg-gray-600"
          }`}
          title="Toggle Grid"
          aria-pressed={gridVisible}
        >
          Grid {gridVisible ? "ON" : "OFF"}
        </button>

        <button
          onClick={toggleMeasurements}
          className={`px-3 py-2 rounded font-medium text-xs transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ${
            measurementsVisible
              ? "bg-teal-600 text-zinc-900 shadow-md"
              : "text-gray-400 hover:text-gray-200 hover:bg-zinc-600 active:bg-gray-600"
          }`}
          title="Toggle Measurements"
          aria-pressed={measurementsVisible}
        >
          Measurements {measurementsVisible ? "ON" : "OFF"}
        </button>

        <button
          onClick={toggleTestMode}
          className={`px-3 py-2 rounded font-medium text-xs transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ${
            testMode
              ? "text-zinc-900 shadow-md bg-amber-700"
              : "text-gray-400 hover:text-gray-200 hover:bg-zinc-600 active:bg-gray-600"
          }`}
          title="Toggle Test Mode"
          aria-pressed={testMode}
        >
          Test {testMode ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
