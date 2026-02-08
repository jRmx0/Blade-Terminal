import React, { useState, useRef } from "react";
import { useCanvasData, useUIState } from "../stores/workspace/workspaceStore";

interface TabProps {
  label: string;
  id: string;
  controlsId: string;
  isActive: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  tabRef?: React.RefObject<HTMLButtonElement | null>;
}

function Tab({
  label,
  id,
  controlsId,
  isActive,
  onClick,
  onKeyDown,
  tabRef,
}: TabProps) {
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
      className={`px-3 py-2 text-xs font-medium transition-all duration-150 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ${
        isActive
          ? "text-teal-600 border-teal-600"
          : "text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-700"
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
    "properties",
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
    <div className="flex flex-col overflow-hidden bg-zinc-800 border-l border-gray-700">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-700 bg-zinc-700">
        <h2 className="text-xs font-bold text-gray-200 tracking-wider">
          INSPECTOR
        </h2>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex border-b border-gray-700 bg-zinc-800">
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
      <div className="overflow-y-auto flex-1 p-4">
        {activeTab === "properties" && (
          <div
            id="panel-properties"
            role="tabpanel"
            aria-labelledby="tab-properties"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-200 mb-2 tracking-wider">
                  ACTIVE TOOL
                </h3>
                <p className="text-xs text-gray-400 bg-zinc-700 px-2.5 py-1.5 rounded">
                  {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
                </p>
              </div>

              {zones.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-200 mb-2 tracking-wider">
                    ZONES ({zones.length})
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {zones.slice(0, 3).map((zone) => (
                      <div
                        key={zone.id}
                        className="p-2.5 bg-zinc-700 rounded border border-gray-700 text-gray-400 truncate hover:bg-zinc-600 transition-colors"
                      >
                        <div className="font-semibold text-gray-200 truncate">
                          {zone.name}
                        </div>
                        <div className="text-[0.65rem] opacity-75 font-mono">
                          {zone.width}×{zone.height} @ ({zone.x}, {zone.y})
                        </div>
                      </div>
                    ))}
                    {zones.length > 3 && (
                      <p className="text-[0.65rem] text-gray-500 px-1">
                        +{zones.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {obstacles.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-200 mb-2 tracking-wider">
                    OBSTACLES ({obstacles.length})
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {obstacles.slice(0, 3).map((obstacle) => (
                      <div
                        key={obstacle.id}
                        className="p-2.5 bg-zinc-700 rounded border border-gray-700 text-gray-400 truncate hover:bg-zinc-600 transition-colors"
                      >
                        <div className="font-semibold text-gray-200 truncate">
                          {obstacle.name}
                        </div>
                        <div className="text-[0.65rem] opacity-75 font-mono">
                          {obstacle.width}×{obstacle.height} @ ({obstacle.x},{" "}
                          {obstacle.y})
                        </div>
                      </div>
                    ))}
                    {obstacles.length > 3 && (
                      <p className="text-[0.65rem] text-gray-500 px-1">
                        +{obstacles.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {paths.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-200 mb-2 tracking-wider">
                    PATHS ({paths.length})
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {paths.slice(0, 3).map((path) => (
                      <div
                        key={path.id}
                        className="p-2.5 bg-zinc-700 rounded border border-gray-700 text-gray-400 hover:bg-zinc-600 transition-colors"
                      >
                        <div className="font-semibold text-gray-200">
                          {path.name}
                        </div>
                        <div className="text-[0.65rem] opacity-75">
                          {path.points.length} points
                        </div>
                      </div>
                    ))}
                    {paths.length > 3 && (
                      <p className="text-[0.65rem] text-gray-500 px-1">
                        +{paths.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {zones.length === 0 &&
                obstacles.length === 0 &&
                paths.length === 0 && (
                  <p className="text-xs text-gray-500 italic">
                    No objects selected. Draw items on the canvas to view
                    properties.
                  </p>
                )}
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div id="panel-results" role="tabpanel" aria-labelledby="tab-results">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-200 mb-2 tracking-wider">
                  PATHFINDING RESULTS
                </h3>
                <div className="space-y-1.5 text-xs text-gray-400">
                  <div className="p-2.5 bg-zinc-700 rounded border border-gray-700">
                    <div className="font-mono text-[0.7rem] text-gray-400">
                      Path Length: —
                    </div>
                  </div>
                  <div className="p-2.5 bg-zinc-700 rounded border border-gray-700">
                    <div className="font-mono text-[0.7rem] text-gray-400">
                      Nodes Explored: —
                    </div>
                  </div>
                  <div className="p-2.5 bg-zinc-700 rounded border border-gray-700">
                    <div className="font-mono text-[0.7rem] text-gray-400">
                      Compute Time: —
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-200 mb-2 tracking-wider">
                  METRICS
                </h3>
                <div className="space-y-1.5 text-xs text-gray-400">
                  <div className="p-2.5 bg-zinc-700 rounded border border-gray-700">
                    <div className="font-mono text-[0.7rem] text-gray-400">
                      Total Area: —
                    </div>
                  </div>
                  <div className="p-2.5 bg-zinc-700 rounded border border-gray-700">
                    <div className="font-mono text-[0.7rem] text-gray-400">
                      Walkable Area: —
                    </div>
                  </div>
                  <div className="p-2.5 bg-zinc-700 rounded border border-gray-700">
                    <div className="font-mono text-[0.7rem] text-gray-400">
                      Obstruction %: —
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full px-3 py-2.5 bg-teal-600 text-zinc-900 rounded font-semibold text-xs hover:bg-teal-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-all duration-150 shadow-sm hover:shadow-md">
                Run Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
