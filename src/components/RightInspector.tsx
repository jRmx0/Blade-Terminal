import React, { useState, useRef } from "react";
import { useCanvasData, useUIState } from "../store/workspaceStore";

interface TabProps {
  label: string;
  id: string;
  controlsId: string;
  isActive: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  tabRef?: React.RefObject<HTMLButtonElement | null>;
}

function Tab({ label, id, controlsId, isActive, onClick, onKeyDown, tabRef }: TabProps) {
  return (
    <button
      ref={tabRef}
      id={id}
      role="tab"
      aria-selected={isActive}
      aria-controls={controlsId}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
        isActive
          ? "text-[var(--color-accent)] border-[var(--color-accent)]"
          : "text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * RightInspector Component
 * Displays properties of selected objects and results
 */
export function RightInspector() {
  const [activeTab, setActiveTab] = useState<"properties" | "results">(
    "properties"
  );
  const { zones, obstacles, paths } = useCanvasData();
  const { activeTool } = useUIState();

  // Refs for focus management
  const propertiesTabRef = useRef<HTMLButtonElement>(null);
  const resultsTabRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard navigation in tabs
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextTab: "properties" | "results" | null = null;

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      nextTab = activeTab === "properties" ? "results" : "properties";
    } else if (e.key === "Home") {
      e.preventDefault();
      nextTab = "properties";
    } else if (e.key === "End") {
      e.preventDefault();
      nextTab = "results";
    }

    if (nextTab) {
      setActiveTab(nextTab);
      // Focus the newly selected tab
      setTimeout(() => {
        if (nextTab === "properties") {
          propertiesTabRef.current?.focus();
        } else {
          resultsTabRef.current?.focus();
        }
      }, 0);
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        borderLeft: "1px solid var(--color-border)",
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 border-b border-[var(--color-border)]"
        style={{
          backgroundColor: "var(--color-bg-tertiary)",
        }}
      >
        <h2 className="text-xs font-bold text-[var(--color-text-primary)]">
          INSPECTOR
        </h2>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        className="flex border-b border-[var(--color-border)]"
        style={{ backgroundColor: "var(--color-bg-secondary)" }}
      >
        <Tab
          id="tab-properties"
          tabRef={propertiesTabRef}
          controlsId="panel-properties"
          label="Properties"
          isActive={activeTab === "properties"}
          onClick={() => setActiveTab("properties")}
          onKeyDown={handleTabKeyDown}
        />
        <Tab
          id="tab-results"
          tabRef={resultsTabRef}
          controlsId="panel-results"
          label="Results"
          isActive={activeTab === "results"}
          onClick={() => setActiveTab("results")}
          onKeyDown={handleTabKeyDown}
        />
      </div>

      {/* Content */}
      <div style={{ overflowY: "auto", flex: 1, padding: "1rem" }}>
        {activeTab === "properties" && (
          <div 
            id="panel-properties"
            role="tabpanel"
            aria-labelledby="tab-properties"
          >
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                Active Tool
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
              </p>
            </div>

            {zones.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                  Zones ({zones.length})
                </h3>
                <div className="space-y-1 text-xs">
                  {zones.slice(0, 3).map((zone) => (
                    <div
                      key={zone.id}
                      className="p-2 bg-[var(--color-bg-tertiary)] rounded text-[var(--color-text-secondary)] truncate"
                    >
                      <strong>{zone.name}</strong>
                      <div className="text-[0.65rem] opacity-75">
                        {zone.width}×{zone.height} @ ({zone.x}, {zone.y})
                      </div>
                    </div>
                  ))}
                  {zones.length > 3 && (
                    <p className="text-[0.65rem] text-[var(--color-text-tertiary)]">
                      +{zones.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {obstacles.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                  Obstacles ({obstacles.length})
                </h3>
                <div className="space-y-1 text-xs">
                  {obstacles.slice(0, 3).map((obstacle) => (
                    <div
                      key={obstacle.id}
                      className="p-2 bg-[var(--color-bg-tertiary)] rounded text-[var(--color-text-secondary)] truncate"
                    >
                      <strong>{obstacle.name}</strong>
                      <div className="text-[0.65rem] opacity-75">
                        {obstacle.width}×{obstacle.height} @ ({obstacle.x},{" "}
                        {obstacle.y})
                      </div>
                    </div>
                  ))}
                  {obstacles.length > 3 && (
                    <p className="text-[0.65rem] text-[var(--color-text-tertiary)]">
                      +{obstacles.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {paths.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                  Paths ({paths.length})
                </h3>
                <div className="space-y-1 text-xs">
                  {paths.slice(0, 3).map((path) => (
                    <div
                      key={path.id}
                      className="p-2 bg-[var(--color-bg-tertiary)] rounded text-[var(--color-text-secondary)]"
                    >
                      <strong>{path.name}</strong>
                      <div className="text-[0.65rem] opacity-75">
                        {path.points.length} points
                      </div>
                    </div>
                  ))}
                  {paths.length > 3 && (
                    <p className="text-[0.65rem] text-[var(--color-text-tertiary)]">
                      +{paths.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {zones.length === 0 &&
              obstacles.length === 0 &&
              paths.length === 0 && (
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  No objects selected. Draw items on the canvas to view
                  properties.
                </p>
              )}
          </div>
          </div>
        )}

        {activeTab === "results" && (
          <div 
            id="panel-results"
            role="tabpanel"
            aria-labelledby="tab-results"
          >
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                Pathfinding Results
              </h3>
              <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <div className="p-2 bg-[var(--color-bg-tertiary)] rounded">
                  <div className="font-mono text-[0.65rem]">Path Length: —</div>
                </div>
                <div className="p-2 bg-[var(--color-bg-tertiary)] rounded">
                  <div className="font-mono text-[0.65rem]">Nodes Explored: —</div>
                </div>
                <div className="p-2 bg-[var(--color-bg-tertiary)] rounded">
                  <div className="font-mono text-[0.65rem]">Compute Time: —</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                Metrics
              </h3>
              <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <div className="p-2 bg-[var(--color-bg-tertiary)] rounded">
                  <div className="font-mono text-[0.65rem]">Total Area: —</div>
                </div>
                <div className="p-2 bg-[var(--color-bg-tertiary)] rounded">
                  <div className="font-mono text-[0.65rem]">
                    Walkable Area: —
                  </div>
                </div>
                <div className="p-2 bg-[var(--color-bg-tertiary)] rounded">
                  <div className="font-mono text-[0.65rem]">
                    Obstruction %: —
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full px-3 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition-colors">
              Run Analysis
            </button>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
