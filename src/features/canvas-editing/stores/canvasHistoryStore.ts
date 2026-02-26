import { create } from "zustand";
import type { CanvasObject } from "@/features/canvas-editing/types/canvas";
import { useCanvasObjectStore } from "./canvasObjectStore";

interface CanvasHistoryState {
    past: CanvasObject[][];
    future: CanvasObject[][];
    canUndo: boolean;
    canRedo: boolean;
    /** True while undo/redo is restoring state — suppresses auto-capture */
    _isTimeTraveling: boolean;
    /** True while a drag operation is in progress — suppresses auto-capture */
    _isBatching: boolean;
    /** Snapshot taken at beginBatch(), committed to past at endBatch() */
    _batchSnapshot: CanvasObject[] | null;

    undo: () => void;
    redo: () => void;
    /** Start a drag batch: saves the current objects and silences auto-capture */
    beginBatch: () => void;
    /** End a drag batch: pushes the saved pre-drag snapshot as a single undo entry */
    endBatch: () => void;
    /** Called by the subscribe listener with the snapshot taken before a mutation */
    _captureSnapshot: (snapshot: CanvasObject[]) => void;
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

        const currentObjects = useCanvasObjectStore.getState().objects;
        const prevObjects = past[past.length - 1];

        set({
            past: past.slice(0, -1),
            future: [currentObjects, ...future],
            canUndo: past.length - 1 > 0,
            canRedo: true,
            _isTimeTraveling: true,
        });

        useCanvasObjectStore.setState({ objects: prevObjects });

        set({ _isTimeTraveling: false });
    },

    redo: () => {
        const { past, future } = get();
        if (future.length === 0) return;

        const currentObjects = useCanvasObjectStore.getState().objects;
        const nextObjects = future[0];

        set({
            past: [...past, currentObjects],
            future: future.slice(1),
            canUndo: true,
            canRedo: future.length - 1 > 0,
            _isTimeTraveling: true,
        });

        useCanvasObjectStore.setState({ objects: nextObjects });

        set({ _isTimeTraveling: false });
    },

    _captureSnapshot: (snapshot) => {
        if (get()._isTimeTraveling || get()._isBatching) return;
        set((s) => ({
            past: [...s.past, snapshot],
            future: [],
            canUndo: true,
            canRedo: false,
        }));
    },

    beginBatch: () => {
        set({
            _isBatching: true,
            _batchSnapshot: useCanvasObjectStore.getState().objects,
        });
    },

    endBatch: () => {
        const { _batchSnapshot, past } = get();
        if (_batchSnapshot === null) {
            set({ _isBatching: false });
            return;
        }
        set((s) => ({
            _isBatching: false,
            _batchSnapshot: null,
            past: [...s.past, _batchSnapshot],
            future: [],
            canUndo: true,
            canRedo: false,
        }));
    },
}));

/**
 * Subscribe to canvasObjectStore. Before each mutation the subscription fires
 * with (newState, prevState) — we push prevState.objects into history.
 * This is synchronous so _isTimeTraveling guards undo/redo restores correctly.
 */
useCanvasObjectStore.subscribe((newState, prevState) => {
    if (newState.objects === prevState.objects) return;
    useCanvasHistoryStore.getState()._captureSnapshot(prevState.objects);
});
