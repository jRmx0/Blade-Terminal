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
        className="w-full flex items-center justify-between py-3 px-3 hover:bg-[var(--color-bg-interactive)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)] transition-colors duration-150"
        aria-expanded={isOpen}
      >
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <span
          className="text-[var(--color-text-secondary)] text-lg flex-shrink-0"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
          }}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-3 py-2 space-y-3 border-t border-[var(--color-border)] text-xs bg-[var(--color-bg-tertiary)]">
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
        className="px-3 py-2.5 border-b border-[var(--color-border)]"
        style={{
          backgroundColor: "var(--color-bg-tertiary)",
        }}
      >
        <h2 className="text-xs font-bold text-[var(--color-text-primary)] tracking-wider">
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
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              placeholder="Default Workspace"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1.5">
              Grid Size
            </label>
            <input
              type="number"
              placeholder="20"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1.5">
              Canvas Width
            </label>
            <input
              type="number"
              placeholder="800"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1.5">
              Canvas Height
            </label>
            <input
              type="number"
              placeholder="600"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
            />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Algorithm"
          isOpen={openSections.has("algorithm")}
          onToggle={() => toggleSection("algorithm")}
        >
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1.5">
              Algorithm Type
            </label>
            <select className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]">
              <option>A*</option>
              <option>Dijkstra</option>
              <option>BFS</option>
              <option>DFS</option>
            </select>
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1.5">
              Heuristic
            </label>
            <select className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]">
              <option>Euclidean</option>
              <option>Manhattan</option>
              <option>Chebyshev</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent)] transition-colors">
              <input type="checkbox" className="w-3.5 h-3.5 rounded focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]" defaultChecked />
              <span className="font-medium">Allow Diagonal</span>
            </label>
          </div>
        </AccordionSection>

        <AccordionSection
          title="API Configuration"
          isOpen={openSections.has("api")}
          onToggle={() => toggleSection("api")}
        >
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1.5">
              API Endpoint
            </label>
            <input
              type="text"
              placeholder="http://localhost:3000"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] font-mono"
            />
          </div>
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1.5">
              Timeout (ms)
            </label>
            <input
              type="number"
              placeholder="5000"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent)] transition-colors">
              <input type="checkbox" className="w-3.5 h-3.5 rounded focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]" />
              <span className="font-medium">Auto Connect</span>
            </label>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Advanced"
          isOpen={openSections.has("advanced")}
          onToggle={() => toggleSection("advanced")}
        >
          <div>
            <label className="flex items-center gap-2 text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent)] transition-colors">
              <input type="checkbox" className="w-3.5 h-3.5 rounded focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]" defaultChecked />
              <span className="font-medium">Snap to Grid</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent)] transition-colors">
              <input type="checkbox" className="w-3.5 h-3.5 rounded focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]" defaultChecked />
              <span className="font-medium">Show Coordinates</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent)] transition-colors">
              <input type="checkbox" className="w-3.5 h-3.5 rounded focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]" defaultChecked />
              <span className="font-medium">Anti-aliasing</span>
            </label>
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
