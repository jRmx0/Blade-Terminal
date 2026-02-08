import React from "react";
import { TopMenuBar } from "./TopMenuBar";
import { ToolBar } from "./ToolBar";
import { LeftPanel } from "./LeftPanel";
import { RightInspector } from "./RightInspector";
import { StatusBar } from "./StatusBar";
import { WorkspaceCanvas } from "./WorkspaceCanvas";

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
    <div className="w-full h-full flex flex-col bg-zinc-900">
      {/* Top Menu & Toolbar */}
      <div>
        <TopMenuBar />
        <ToolBar />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-[280px_1fr_300px] flex-1 overflow-hidden gap-0">
        {/* Left Panel */}
        <div className="overflow-hidden">
          <LeftPanel />
        </div>

        {/* Center Canvas Area - Konva canvas */}
        <WorkspaceCanvas />

        {/* Right Inspector Panel */}
        <div className="overflow-hidden">
          <RightInspector />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />
    </div>
  );
}
