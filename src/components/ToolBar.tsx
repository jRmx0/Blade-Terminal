import React from "react";
import { useUIState, useUIActions } from "../stores/workspaceStore";
import type { Tool } from "../stores/workspaceStore";

interface ToolButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ label, isActive, onClick }: ToolButtonProps) {
  const baseClasses =
    "px-3 py-2 rounded font-medium text-sm flex items-center gap-2 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)]";
  const activeClasses = isActive
    ? "bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-md"
    : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-interactive)] active:bg-[var(--color-border-focus)]";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses}`}
      title={label}
      aria-pressed={isActive}
    >
      <span className={`inline-block w-4 h-4 rounded transition-colors duration-150 ${
        isActive ? "bg-[var(--color-bg-primary)] opacity-70" : "bg-[var(--color-border)]"
      }`} />
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
    <div
      className="flex items-center justify-between"
      style={{
        height: "3rem",
        backgroundColor: "var(--color-bg-secondary)",
        borderBottom: "1px solid var(--color-border)",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        gap: "1rem",
        overflowX: "auto",
      }}
    >
      {/* Left: Tool buttons */}
      <div
        className="flex items-center gap-1"
        style={{
          borderRight: "1px solid var(--color-border)",
          paddingRight: "1rem",
        }}
      >
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
          className={`px-3 py-2 rounded font-medium text-xs transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)] ${
            gridVisible
              ? "bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-md"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-interactive)] active:bg-[var(--color-border-focus)]"
          }`}
          title="Toggle Grid"
          aria-pressed={gridVisible}
        >
          Grid {gridVisible ? "ON" : "OFF"}
        </button>

        <button
          onClick={toggleMeasurements}
          className={`px-3 py-2 rounded font-medium text-xs transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)] ${
            measurementsVisible
              ? "bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-md"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-interactive)] active:bg-[var(--color-border-focus)]"
          }`}
          title="Toggle Measurements"
          aria-pressed={measurementsVisible}
        >
          Measurements {measurementsVisible ? "ON" : "OFF"}
        </button>

        <button
          onClick={toggleTestMode}
          className={`px-3 py-2 rounded font-medium text-xs transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)] ${
            testMode
              ? "text-[var(--color-bg-primary)] shadow-md bg-[var(--color-test-mode)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-interactive)] active:bg-[var(--color-border-focus)]"
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
