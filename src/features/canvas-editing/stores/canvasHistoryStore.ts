import { create } from "zustand";
import type { EnvObject, EnvVertex } from "@/types/envTypes";
import { useCanvasObjectStore } from "./canvasObjectStore";

// ---------------------------------------------------------------------------
// Snapshot — captures the full relational state of the canvas
// ---------------------------------------------------------------------------

interface CanvasSnapshot {
    objects: EnvObject[];
    vertices: EnvVertex[];
}

// ---------------------------------------------------------------------------
// Dirty-set diff — used when restoring a snapshot so that dirty tracking
// stays accurate relative to the DB after an undo/redo.
// ---------------------------------------------------------------------------

function diffSnapshots(
    from: CanvasSnapshot,
    to: CanvasSnapshot,
): {
    dirtyObjectIds: Set<number>;
    dirtyVertexIds: Set<number>;
    deletedObjectIds: Set<number>;
    deletedVertexIds: Map<number, number>;
} {
    const fromObjectMap = new Map(from.objects.map((o) => [o.id, o]));
    const fromVertexMap = new Map(from.vertices.map((v) => [v.id, v]));
    const toObjectIds = new Set(to.objects.map((o) => o.id));
    const toVertexIds = new Set(to.vertices.map((v) => v.id));

    const dirtyObjectIds = new Set(to.objects.filter((o) => fromObjectMap.get(o.id) !== o).map((o) => o.id));
    const deletedObjectIds = new Set(from.objects.filter((o) => !toObjectIds.has(o.id)).map((o) => o.id));
    const dirtyVertexIds = new Set(to.vertices.filter((v) => fromVertexMap.get(v.id) !== v).map((v) => v.id));
    const deletedVertexIds = new Map(
        from.vertices.filter((v) => !toVertexIds.has(v.id)).map((v) => [v.id, v.objectId] as [number, number]),
    );

    return { dirtyObjectIds, dirtyVertexIds, deletedObjectIds, deletedVertexIds };
}

function restoreSnapshot(current: CanvasSnapshot, target: CanvasSnapshot) {
    const dirty = diffSnapshots(current, target);
    useCanvasObjectStore.setState({
        objects: target.objects,
        vertices: target.vertices,
        ...dirty,
    });
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface CanvasHistoryState {
    past: CanvasSnapshot[];
    future: CanvasSnapshot[];
    canUndo: boolean;
    canRedo: boolean;
    _isTimeTraveling: boolean;
    _isBatching: boolean;
    _batchSnapshot: CanvasSnapshot | null;

    undo: () => void;
    redo: () => void;
    beginBatch: () => void;
    endBatch: () => void;
    /** Clears all undo/redo history. Call after loading a new environment. */
    resetHistory: () => void;
}

export const useCanvasHistoryStore = create<CanvasHistoryState>()((set, get) => ({
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,
    _isTimeTraveling: false,
    _isBatching: false,
    _batchSnapshot: null,

    undo: () => {
        const { past, future } = get();
        if (past.length === 0) return;

        const snapshot = past[past.length - 1]!;
        const current: CanvasSnapshot = {
            objects: useCanvasObjectStore.getState().objects,
            vertices: useCanvasObjectStore.getState().vertices,
        };

        set({ _isTimeTraveling: true });
        restoreSnapshot(current, snapshot);
        set({
            _isTimeTraveling: false,
            past: past.slice(0, -1),
            future: [current, ...future],
            canUndo: past.length - 1 > 0,
            canRedo: true,
        });
    },

    redo: () => {
        const { past, future } = get();
        if (future.length === 0) return;

        const snapshot = future[0]!;
        const current: CanvasSnapshot = {
            objects: useCanvasObjectStore.getState().objects,
            vertices: useCanvasObjectStore.getState().vertices,
        };

        set({ _isTimeTraveling: true });
        restoreSnapshot(current, snapshot);
        set({
            _isTimeTraveling: false,
            past: [...past, current],
            future: future.slice(1),
            canUndo: true,
            canRedo: future.length - 1 > 0,
        });
    },

    beginBatch: () => {
        const { _isBatching } = get();
        if (_isBatching) return;
        const { objects, vertices } = useCanvasObjectStore.getState();
        set({ _isBatching: true, _batchSnapshot: { objects, vertices } });
    },

    endBatch: () => {
        const { _isBatching, _batchSnapshot } = get();
        if (!_isBatching || !_batchSnapshot) return;

        const { objects, vertices } = useCanvasObjectStore.getState();
        const hasChanged = objects !== _batchSnapshot.objects || vertices !== _batchSnapshot.vertices;

        if (!hasChanged) {
            set({ _isBatching: false, _batchSnapshot: null });
            return;
        }

        set((s) => {
            const nextPast = [...s.past, _batchSnapshot!];
            return {
                _isBatching: false,
                _batchSnapshot: null,
                past: nextPast,
                future: [],
                canUndo: nextPast.length > 0,
                canRedo: false,
            };
        });
    },
    resetHistory: () =>
        set({ past: [], future: [], canUndo: false, canRedo: false, _batchSnapshot: null, _isBatching: false }),
}));

// Subscribe to the object store — push a snapshot to past before every change
useCanvasObjectStore.subscribe((next, prev) => {
    if (next.objects === prev.objects && next.vertices === prev.vertices) return;
    const { _isTimeTraveling, _isBatching } = useCanvasHistoryStore.getState();
    if (_isTimeTraveling || _isBatching) return;

    const prevSnapshot: CanvasSnapshot = { objects: prev.objects, vertices: prev.vertices };
    useCanvasHistoryStore.setState((s) => {
        const nextPast = [...s.past, prevSnapshot];
        return { past: nextPast, future: [], canUndo: nextPast.length > 0, canRedo: false };
    });
});

/** Convenience exports for drag hooks. */
export const beginBatch = () => useCanvasHistoryStore.getState().beginBatch();
export const endBatch = () => useCanvasHistoryStore.getState().endBatch();
