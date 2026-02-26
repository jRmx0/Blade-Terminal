import { create } from "zustand";
import type { CanvasObject } from "@/features/canvas-editing/types/canvas";
import { useCanvasObjectStore } from "./canvasObjectStore";

interface CanvasHistoryState {
    past: CanvasObject[][];
    future: CanvasObject[][];
    canUndo: boolean;
    canRedo: boolean;
    _isTimeTraveling: boolean;
    _isBatching: boolean;
    _batchSnapshot: CanvasObject[] | null;

    undo: () => void;
    redo: () => void;
    beginBatch: () => void;
    endBatch: () => void;
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
        set({ _isTimeTraveling: true, past: past.slice(0, -1), future: [currentObjects, ...future], canUndo: past.length - 1 > 0, canRedo: true });
        useCanvasObjectStore.setState({ objects: prevObjects });
        set({ _isTimeTraveling: false });
    },

    redo: () => {
        const { past, future } = get();
        if (future.length === 0) return;
        const currentObjects = useCanvasObjectStore.getState().objects;
        const nextObjects = future[0];
        set({ _isTimeTraveling: true, past: [...past, currentObjects], future: future.slice(1), canUndo: true, canRedo: future.length - 1 > 0 });
        useCanvasObjectStore.setState({ objects: nextObjects });
        set({ _isTimeTraveling: false });
    },

    beginBatch: () => {
        set({ _isBatching: true, _batchSnapshot: useCanvasObjectStore.getState().objects });
    },

    endBatch: () => {
        const { _batchSnapshot } = get();
        if (_batchSnapshot === null) { set({ _isBatching: false }); return; }
        set((s) => ({ _isBatching: false, _batchSnapshot: null, past: [...s.past, _batchSnapshot], future: [], canUndo: true, canRedo: false }));
    },
}));

useCanvasObjectStore.subscribe((next, prev) => {
    if (next.objects === prev.objects) return;
    const { _isTimeTraveling, _isBatching } = useCanvasHistoryStore.getState();
    if (_isTimeTraveling || _isBatching) return;
    useCanvasHistoryStore.setState((s) => ({ past: [...s.past, prev.objects], future: [], canUndo: true, canRedo: false }));
});

/** Convenience exports for drag hooks */
export const beginBatch = () => useCanvasHistoryStore.getState().beginBatch();
export const endBatch = () => useCanvasHistoryStore.getState().endBatch();