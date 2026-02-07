import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

/**
 * Tool types available in the workspace UI
 */
export type Tool = "select" | "zone" | "obstacle" | "path" | "measure";

/**
 * A Zone represents an area on the canvas with position and dimensions
 */
export interface Zone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  name: string;
}

/**
 * An Obstacle represents a blocked area on the canvas
 */
export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  name: string;
}

/**
 * A Path represents waypoints or routes on the canvas
 */
export interface Path {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
  name: string;
}

/**
 * UI State for the workspace
 */
export interface UIState {
  activeTool: Tool;
  gridVisible: boolean;
  measurementsVisible: boolean;
  testMode: boolean;
}

/**
 * Canvas data state
 */
export interface CanvasData {
  zones: Zone[];
  obstacles: Obstacle[];
  paths: Path[];
}

/**
 * Complete workspace store state
 */
export interface WorkspaceStore extends UIState, CanvasData {
  // UI Actions
  setActiveTool: (tool: Tool) => void;
  toggleGrid: () => void;
  toggleMeasurements: () => void;
  toggleTestMode: () => void;

  // Zone Actions
  addZone: (zone: Zone) => void;
  removeZone: (zoneId: string) => void;
  updateZone: (zoneId: string, updates: Partial<Omit<Zone, "id">>) => void;

  // Obstacle Actions
  addObstacle: (obstacle: Obstacle) => void;
  removeObstacle: (obstacleId: string) => void;
  updateObstacle: (obstacleId: string, updates: Partial<Omit<Obstacle, "id">>) => void;

  // Path Actions
  addPath: (path: Path) => void;
  removePath: (pathId: string) => void;
  updatePath: (pathId: string, updates: Partial<Omit<Path, "id">>) => void;

  // Reset
  reset: () => void;
}

// Placeholder data for realistic Konva canvas rendering
const defaultZones: Zone[] = [
  {
    id: "zone-1",
    x: 50,
    y: 50,
    width: 300,
    height: 200,
    color: "#e3f2fd",
    name: "Work Area A",
  },
  {
    id: "zone-2",
    x: 400,
    y: 50,
    width: 250,
    height: 180,
    color: "#f3e5f5",
    name: "Work Area B",
  },
];

const defaultObstacles: Obstacle[] = [
  {
    id: "obstacle-1",
    x: 100,
    y: 150,
    width: 80,
    height: 100,
    color: "#ffebee",
    name: "Obstacle 1",
  },
  {
    id: "obstacle-2",
    x: 450,
    y: 100,
    width: 120,
    height: 60,
    color: "#fce4ec",
    name: "Obstacle 2",
  },
];

const defaultPaths: Path[] = [
  {
    id: "path-1",
    points: [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 200 },
    ],
    color: "#2196f3",
    strokeWidth: 2,
    name: "Path 1",
  },
  {
    id: "path-2",
    points: [
      { x: 450, y: 50 },
      { x: 500, y: 150 },
      { x: 550, y: 150 },
    ],
    color: "#4caf50",
    strokeWidth: 2,
    name: "Path 2",
  },
];

/**
 * Converts Path points from {x, y} object format to Konva's flattened number array format
 * @param path The Path object with {x, y}[] points
 * @returns Flattened array suitable for Konva: [x1, y1, x2, y2, ...]
 */
export const toKonvaPoints = (path: Path): number[] => {
  return path.points.flatMap((point) => [point.x, point.y]);
};

/**
 * Zustand store for workspace UI and canvas state
 */
export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  // Initial UI State
  activeTool: "select",
  gridVisible: true,
  measurementsVisible: false,
  testMode: false,

  // Initial Canvas Data
  zones: defaultZones,
  obstacles: defaultObstacles,
  paths: defaultPaths,

  // UI Actions
  setActiveTool: (tool: Tool) =>
    set({ activeTool: tool }),

  toggleGrid: () =>
    set((state) => ({ gridVisible: !state.gridVisible })),

  toggleMeasurements: () =>
    set((state) => ({
      measurementsVisible: !state.measurementsVisible,
    })),

  toggleTestMode: () =>
    set((state) => ({ testMode: !state.testMode })),

  // Zone Actions
  addZone: (zone: Zone) =>
    set((state) => ({ zones: [...state.zones, zone] })),

  removeZone: (zoneId: string) =>
    set((state) => ({
      zones: state.zones.filter((z) => z.id !== zoneId),
    })),

  updateZone: (zoneId: string, updates: Partial<Omit<Zone, "id">>) =>
    set((state) => ({
      zones: state.zones.map((z) => (z.id === zoneId ? { ...z, ...updates } : z)),
    })),

  // Obstacle Actions
  addObstacle: (obstacle: Obstacle) =>
    set((state) => ({ obstacles: [...state.obstacles, obstacle] })),

  removeObstacle: (obstacleId: string) =>
    set((state) => ({
      obstacles: state.obstacles.filter((o) => o.id !== obstacleId),
    })),

  updateObstacle: (obstacleId: string, updates: Partial<Omit<Obstacle, "id">>) =>
    set((state) => ({
      obstacles: state.obstacles.map((o) =>
        o.id === obstacleId ? { ...o, ...updates } : o
      ),
    })),

  // Path Actions
  addPath: (path: Path) =>
    set((state) => ({ paths: [...state.paths, path] })),

  removePath: (pathId: string) =>
    set((state) => ({
      paths: state.paths.filter((p) => p.id !== pathId),
    })),

  updatePath: (pathId: string, updates: Partial<Omit<Path, "id">>) =>
    set((state) => ({
      paths: state.paths.map((p) =>
        p.id === pathId ? { ...p, ...updates } : p
      ),
    })),

  // Reset
  reset: () =>
    set(() => ({
      activeTool: "select",
      gridVisible: true,
      measurementsVisible: false,
      testMode: false,
      zones: defaultZones,
      obstacles: defaultObstacles,
      paths: defaultPaths,
    })),
}));

/**
 * Convenience hook to get only UI state
 * Uses useShallow to prevent unnecessary re-renders when object reference changes
 */
export const useUIState = () =>
  useWorkspaceStore(
    useShallow((state) => ({
      activeTool: state.activeTool,
      gridVisible: state.gridVisible,
      measurementsVisible: state.measurementsVisible,
      testMode: state.testMode,
    }))
  );

/**
 * Convenience hook to get only canvas data
 * Uses useShallow to prevent unnecessary re-renders when object reference changes
 */
export const useCanvasData = () =>
  useWorkspaceStore(
    useShallow((state) => ({
      zones: state.zones,
      obstacles: state.obstacles,
      paths: state.paths,
    }))
  );

/**
 * Convenience hook to get only UI actions
 * Uses useShallow to prevent unnecessary re-renders when object reference changes
 */
export const useUIActions = () =>
  useWorkspaceStore(
    useShallow((state) => ({
      setActiveTool: state.setActiveTool,
      toggleGrid: state.toggleGrid,
      toggleMeasurements: state.toggleMeasurements,
      toggleTestMode: state.toggleTestMode,
    }))
  );

/**
 * Convenience hook to get only canvas actions
 * Uses useShallow to prevent unnecessary re-renders when object reference changes
 */
export const useCanvasActions = () =>
  useWorkspaceStore(
    useShallow((state) => ({
      addZone: state.addZone,
      removeZone: state.removeZone,
      updateZone: state.updateZone,
      addObstacle: state.addObstacle,
      removeObstacle: state.removeObstacle,
      updateObstacle: state.updateObstacle,
      addPath: state.addPath,
      removePath: state.removePath,
      updatePath: state.updatePath,
    }))
  );
