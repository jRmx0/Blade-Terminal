import React from "react";
import { TopMenuBar } from "./TopMenuBar";
import { ToolBar } from "./ToolBar";
import { LeftPanel } from "./LeftPanel";
import { RightInspector } from "./RightInspector";
import { StatusBar } from "./StatusBar";

/**
 * WorkspaceLayout Component
 * Main CAD-like workspace grid layout with all major sections
 * Structure:
 * - Top: Menu bar + Toolbar
 * - Middle: Left panel | Center canvas | Right inspector
 * - Bottom: Status bar
 */
export function WorkspaceLayout() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-bg-primary)",
      }}
    >
      {/* Top Menu & Toolbar */}
      <div>
        <TopMenuBar />
        <ToolBar />
      </div>

      {/* Main Content Area */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr 300px",
          flex: 1,
          overflow: "hidden",
          gap: 0,
        }}
      >
        {/* Left Panel */}
        <div style={{ overflow: "hidden" }}>
          <LeftPanel />
        </div>

        {/* Center Canvas Area - Placeholder for Konva */}
        <div
          style={{
            backgroundColor: "var(--canvas-bg)",
            backgroundImage: `
              linear-gradient(var(--canvas-grid) 1px, transparent 1px),
              linear-gradient(90deg, var(--canvas-grid) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Placeholder message for Phase 4 Konva canvas */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <h2
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "1rem",
                marginBottom: "0.5rem",
                opacity: 0.6,
              }}
            >
              Canvas Area
            </h2>
            <p
              style={{
                color: "var(--color-text-tertiary)",
                fontSize: "0.875rem",
                opacity: 0.4,
              }}
            >
              Phase 4: Konva canvas will be rendered here
            </p>
          </div>
        </div>

        {/* Right Inspector Panel */}
        <div style={{ overflow: "hidden" }}>
          <RightInspector />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />
    </div>
  );
}
