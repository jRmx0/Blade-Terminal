import React, { useState } from "react";

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <div className="border-t border-[var(--color-border)] first:border-t-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-3 hover:bg-[var(--color-bg-interactive)] transition-colors"
        aria-expanded={isOpen}
      >
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <span
          className="text-[var(--color-text-secondary)]"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
          }}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-2 border-t border-[var(--color-border)] text-xs">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * LeftPanel Component
 * Displays collapsible sections for Environment, Algorithm, API configuration
 */
export function LeftPanel() {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["environment", "algorithm"])
  );

  const toggleSection = (section: string) => {
    const newSections = new Set(openSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setOpenSections(newSections);
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        borderRight: "1px solid var(--color-border)",
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
          WORKSPACE
        </h2>
      </div>

      {/* Scrollable accordion content */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        <AccordionSection
          title="Environment"
          isOpen={openSections.has("environment")}
          onToggle={() => toggleSection("environment")}
        >
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              placeholder="Default Workspace"
              className="w-full px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              Grid Size
            </label>
            <input
              type="number"
              placeholder="20"
              className="w-full px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              Canvas Width
            </label>
            <input
              type="number"
              placeholder="800"
              className="w-full px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              Canvas Height
            </label>
            <input
              type="number"
              placeholder="600"
              className="w-full px-2 py-1 text-xs"
            />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Algorithm"
          isOpen={openSections.has("algorithm")}
          onToggle={() => toggleSection("algorithm")}
        >
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              Algorithm Type
            </label>
            <select className="w-full px-2 py-1 text-xs">
              <option>A*</option>
              <option>Dijkstra</option>
              <option>BFS</option>
              <option>DFS</option>
            </select>
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              Heuristic
            </label>
            <select className="w-full px-2 py-1 text-xs">
              <option>Euclidean</option>
              <option>Manhattan</option>
              <option>Chebyshev</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-[var(--color-text-secondary)] cursor-pointer">
              <input type="checkbox" className="w-3 h-3" defaultChecked />
              <span>Allow Diagonal</span>
            </label>
          </div>
        </AccordionSection>

        <AccordionSection
          title="API Configuration"
          isOpen={openSections.has("api")}
          onToggle={() => toggleSection("api")}
        >
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              API Endpoint
            </label>
            <input
              type="text"
              placeholder="http://localhost:3000"
              className="w-full px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              Timeout (ms)
            </label>
            <input
              type="number"
              placeholder="5000"
              className="w-full px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-[var(--color-text-secondary)] cursor-pointer">
              <input type="checkbox" className="w-3 h-3" />
              <span>Auto Connect</span>
            </label>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Advanced"
          isOpen={openSections.has("advanced")}
          onToggle={() => toggleSection("advanced")}
        >
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              Snap to Grid
            </label>
            <label className="flex items-center gap-2 text-[var(--color-text-secondary)] cursor-pointer">
              <input type="checkbox" className="w-3 h-3" defaultChecked />
              <span>Enabled</span>
            </label>
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              Show Coordinates
            </label>
            <label className="flex items-center gap-2 text-[var(--color-text-secondary)] cursor-pointer">
              <input type="checkbox" className="w-3 h-3" defaultChecked />
              <span>Enabled</span>
            </label>
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] mb-1">
              Anti-aliasing
            </label>
            <label className="flex items-center gap-2 text-[var(--color-text-secondary)] cursor-pointer">
              <input type="checkbox" className="w-3 h-3" defaultChecked />
              <span>Enabled</span>
            </label>
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
