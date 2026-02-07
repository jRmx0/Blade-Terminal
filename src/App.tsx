import "./index.css";
import { useUIState, useCanvasData, useUIActions } from "./store/workspaceStore";

export function App() {
  const { activeTool, gridVisible, testMode } = useUIState();
  const { zones, obstacles, paths } = useCanvasData();
  const { setActiveTool, toggleTestMode } = useUIActions();

  return (
    <div className="app p-4">
      <h1 className="text-2xl font-bold mb-4">Blade of Grass - Workspace UI</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">
            Active Tool: <span className="font-mono font-bold text-blue-700">{activeTool}</span>
          </p>
          <button 
            onClick={() => setActiveTool("select")}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Switch to Select Tool
          </button>
        </div>

        <div>
          <p className="text-sm text-gray-600">
            Grid Visible: <span className="font-mono font-bold">{gridVisible ? "✓" : "✗"}</span>
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">
            Test Mode: <span className="font-mono font-bold text-amber-600">{testMode ? "ON" : "OFF"}</span>
          </p>
          <button 
            onClick={() => toggleTestMode()}
            className="mt-2 px-3 py-1 bg-amber-500 text-white rounded text-sm"
          >
            Toggle Test Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded p-3 bg-blue-50">
          <h3 className="font-bold text-blue-900 mb-2">Zones ({zones.length})</h3>
          <ul className="text-xs space-y-1">
            {zones.map((z) => (
              <li key={z.id} className="text-blue-800">
                {z.name}: {z.width}×{z.height}
              </li>
            ))}
          </ul>
        </div>

        <div className="border rounded p-3 bg-red-50">
          <h3 className="font-bold text-red-900 mb-2">Obstacles ({obstacles.length})</h3>
          <ul className="text-xs space-y-1">
            {obstacles.map((o) => (
              <li key={o.id} className="text-red-800">
                {o.name}: {o.width}×{o.height}
              </li>
            ))}
          </ul>
        </div>

        <div className="border rounded p-3 bg-green-50">
          <h3 className="font-bold text-green-900 mb-2">Paths ({paths.length})</h3>
          <ul className="text-xs space-y-1">
            {paths.map((p) => (
              <li key={p.id} className="text-green-800">
                {p.name}: {p.points.length} points
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Store is ready for Phase 3 & 4 canvas rendering with Konva
      </p>
    </div>
  );
}

export default App;
