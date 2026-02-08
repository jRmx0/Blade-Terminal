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
    <div className="border-t border-gray-700 first:border-t-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-3 hover:bg-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-600 transition-colors duration-150"
        aria-expanded={isOpen}
      >
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        <span
          className="text-gray-400 text-lg flex-shrink-0"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
          }}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-3 py-2 space-y-3 border-t border-gray-700 text-xs bg-zinc-700">
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
    new Set(["environment", "algorithm"]),
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
    <div className="flex flex-col overflow-hidden bg-zinc-800 border-r border-gray-700">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-700 bg-zinc-700">
        <h2 className="text-xs font-bold text-gray-200 tracking-wider">
          WORKSPACE
        </h2>
      </div>

      {/* Scrollable accordion content */}
      <div className="overflow-y-auto flex-1">
        <AccordionSection
          title="Environment"
          isOpen={openSections.has("environment")}
          onToggle={() => toggleSection("environment")}
        >
          <div>
            <label className="block text-gray-400 font-medium mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              placeholder="Default Workspace"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-teal-600 focus-visible:ring-1 focus-visible:ring-teal-600"
            />
          </div>
          <div>
            <label className="block text-gray-400 font-medium mb-1.5">
              Grid Size
            </label>
            <input
              type="number"
              placeholder="20"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-teal-600 focus-visible:ring-1 focus-visible:ring-teal-600"
            />
          </div>
          <div>
            <label className="block text-gray-400 font-medium mb-1.5">
              Canvas Width
            </label>
            <input
              type="number"
              placeholder="800"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-teal-600 focus-visible:ring-1 focus-visible:ring-teal-600"
            />
          </div>
          <div>
            <label className="block text-gray-400 font-medium mb-1.5">
              Canvas Height
            </label>
            <input
              type="number"
              placeholder="600"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-teal-600 focus-visible:ring-1 focus-visible:ring-teal-600"
            />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Algorithm"
          isOpen={openSections.has("algorithm")}
          onToggle={() => toggleSection("algorithm")}
        >
          <div>
            <label className="block text-gray-400 font-medium mb-1.5">
              Algorithm Type
            </label>
            <select className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-teal-600 focus-visible:ring-1 focus-visible:ring-teal-600">
              <option>A*</option>
              <option>Dijkstra</option>
              <option>BFS</option>
              <option>DFS</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 font-medium mb-1.5">
              Heuristic
            </label>
            <select className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-teal-600 focus-visible:ring-1 focus-visible:ring-teal-600">
              <option>Euclidean</option>
              <option>Manhattan</option>
              <option>Chebyshev</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-gray-200 cursor-pointer hover:text-teal-600 transition-colors">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded focus-visible:outline-2 focus-visible:outline-teal-600"
                defaultChecked
              />
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
            <label className="block text-gray-400 font-medium mb-1.5">
              API Endpoint
            </label>
            <input
              type="text"
              placeholder="http://localhost:3000"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-teal-600 focus-visible:ring-1 focus-visible:ring-teal-600 font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-400 font-medium mb-1.5">
              Timeout (ms)
            </label>
            <input
              type="number"
              placeholder="5000"
              className="w-full px-2.5 py-1.5 text-xs rounded focus-visible:outline-none focus-visible:border-teal-600 focus-visible:ring-1 focus-visible:ring-teal-600"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-gray-200 cursor-pointer hover:text-teal-600 transition-colors">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded focus-visible:outline-2 focus-visible:outline-teal-600"
              />
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
            <label className="flex items-center gap-2 text-gray-200 cursor-pointer hover:text-teal-600 transition-colors">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded focus-visible:outline-2 focus-visible:outline-teal-600"
                defaultChecked
              />
              <span className="font-medium">Snap to Grid</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 text-gray-200 cursor-pointer hover:text-teal-600 transition-colors">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded focus-visible:outline-2 focus-visible:outline-teal-600"
                defaultChecked
              />
              <span className="font-medium">Show Coordinates</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 text-gray-200 cursor-pointer hover:text-teal-600 transition-colors">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded focus-visible:outline-2 focus-visible:outline-teal-600"
                defaultChecked
              />
              <span className="font-medium">Anti-aliasing</span>
            </label>
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
