import { create } from "zustand";
import type { CanvasObject } from "@/features/canvas-editing/types/canvas";
import { useCanvasObjectStore } from "./canvasObjectStore";

interface CanvasObjectDelta {
    id: string;
    before: CanvasObject | null;
    after: CanvasObject | null;
    beforeIndex: number;
    afterIndex: number;
}

interface CanvasHistoryEntry {
    deltas: CanvasObjectDelta[];
}

interface CanvasHistoryState {
    past: CanvasHistoryEntry[];
    future: CanvasHistoryEntry[];
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

function clampIndex(index: number, maxLength: number) {
    return Math.max(0, Math.min(index, maxLength));
}

function insertAt(objects: CanvasObject[], index: number, object: CanvasObject) {
    const safeIndex = clampIndex(index, objects.length);
    return [...objects.slice(0, safeIndex), object, ...objects.slice(safeIndex)];
}

function removeById(objects: CanvasObject[], id: string) {
    return objects.filter((o) => o.id !== id);
}

function replaceById(objects: CanvasObject[], id: string, object: CanvasObject) {
    return objects.map((o) => (o.id === id ? object : o));
}

function moveByIdToIndex(objects: CanvasObject[], id: string, targetIndex: number) {
    const fromIndex = objects.findIndex((o) => o.id === id);
    if (fromIndex < 0) return objects;
    const item = objects[fromIndex];
    if (!item) return objects;
    const withoutItem = [...objects.slice(0, fromIndex), ...objects.slice(fromIndex + 1)];
    const safeIndex = clampIndex(targetIndex, withoutItem.length);
    return [...withoutItem.slice(0, safeIndex), item, ...withoutItem.slice(safeIndex)];
}

function buildHistoryEntry(beforeObjects: CanvasObject[], afterObjects: CanvasObject[]): CanvasHistoryEntry | null {
    if (beforeObjects === afterObjects) return null;

    const beforeById = new Map(beforeObjects.map((object, index) => [object.id, { object, index }]));
    const afterById = new Map(afterObjects.map((object, index) => [object.id, { object, index }]));

    const ids = new Set([...beforeById.keys(), ...afterById.keys()]);
    const deltas: CanvasObjectDelta[] = [];

    for (const id of ids) {
        const beforeEntry = beforeById.get(id);
        const afterEntry = afterById.get(id);

        const before = beforeEntry?.object ?? null;
        const after = afterEntry?.object ?? null;
        const beforeIndex = beforeEntry?.index ?? -1;
        const afterIndex = afterEntry?.index ?? -1;

        const hasChanged = before !== after || beforeIndex !== afterIndex;
        if (!hasChanged) continue;

        deltas.push({ id, before, after, beforeIndex, afterIndex });
    }

    if (deltas.length === 0) return null;
    return { deltas };
}

function applyUndo(objects: CanvasObject[], entry: CanvasHistoryEntry) {
    const additions = entry.deltas
        .filter((d) => d.before === null && d.after !== null)
        .sort((a, b) => b.afterIndex - a.afterIndex);
    const removals = entry.deltas
        .filter((d) => d.before !== null && d.after === null)
        .sort((a, b) => a.beforeIndex - b.beforeIndex);
    const updates = entry.deltas.filter((d) => d.before !== null && d.after !== null);

    let next = objects;

    for (const delta of additions) {
        next = removeById(next, delta.id);
    }

    for (const delta of updates) {
        next = replaceById(next, delta.id, delta.before!);
        if (delta.beforeIndex >= 0 && delta.beforeIndex !== delta.afterIndex) {
            next = moveByIdToIndex(next, delta.id, delta.beforeIndex);
        }
    }

    for (const delta of removals) {
        next = insertAt(next, delta.beforeIndex, delta.before!);
    }

    return next;
}

function applyRedo(objects: CanvasObject[], entry: CanvasHistoryEntry) {
    const removals = entry.deltas
        .filter((d) => d.before !== null && d.after === null)
        .sort((a, b) => b.beforeIndex - a.beforeIndex);
    const additions = entry.deltas
        .filter((d) => d.before === null && d.after !== null)
        .sort((a, b) => a.afterIndex - b.afterIndex);
    const updates = entry.deltas.filter((d) => d.before !== null && d.after !== null);

    let next = objects;

    for (const delta of removals) {
        next = removeById(next, delta.id);
    }

    for (const delta of updates) {
        next = replaceById(next, delta.id, delta.after!);
        if (delta.afterIndex >= 0 && delta.afterIndex !== delta.beforeIndex) {
            next = moveByIdToIndex(next, delta.id, delta.afterIndex);
        }
    }

    for (const delta of additions) {
        next = insertAt(next, delta.afterIndex, delta.after!);
    }

    return next;
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

        const entry = past[past.length - 1];
        if (!entry) return;
        const currentObjects = useCanvasObjectStore.getState().objects;
        const prevObjects = applyUndo(currentObjects, entry);

        set({ _isTimeTraveling: true, past: past.slice(0, -1), future: [entry, ...future], canUndo: past.length - 1 > 0, canRedo: true });
        useCanvasObjectStore.setState({ objects: prevObjects });
        set({ _isTimeTraveling: false });
    },

    redo: () => {
        const { past, future } = get();
        if (future.length === 0) return;

        const entry = future[0];
        if (!entry) return;
        const currentObjects = useCanvasObjectStore.getState().objects;
        const nextObjects = applyRedo(currentObjects, entry);

        set({ _isTimeTraveling: true, past: [...past, entry], future: future.slice(1), canUndo: true, canRedo: future.length - 1 > 0 });
        useCanvasObjectStore.setState({ objects: nextObjects });
        set({ _isTimeTraveling: false });
    },

    beginBatch: () => {
        const { _isBatching } = get();
        if (_isBatching) return;
        set({ _isBatching: true, _batchSnapshot: useCanvasObjectStore.getState().objects });
    },

    endBatch: () => {
        const { _isBatching, _batchSnapshot } = get();
        if (!_isBatching) return;

        const currentObjects = useCanvasObjectStore.getState().objects;
        const entry = _batchSnapshot ? buildHistoryEntry(_batchSnapshot, currentObjects) : null;

        if (!entry) {
            set({ _isBatching: false, _batchSnapshot: null });
            return;
        }

        set((s) => {
            const nextPast = [...s.past, entry];
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
}));

useCanvasObjectStore.subscribe((next, prev) => {
    if (next.objects === prev.objects) return;
    const { _isTimeTraveling, _isBatching } = useCanvasHistoryStore.getState();
    if (_isTimeTraveling || _isBatching) return;

    const entry = buildHistoryEntry(prev.objects, next.objects);
    if (!entry) return;

    useCanvasHistoryStore.setState((s) => {
        const nextPast = [...s.past, entry];
        return {
            past: nextPast,
            future: [],
            canUndo: nextPast.length > 0,
            canRedo: false,
        };
    });
});

/** Convenience exports for drag hooks */
export const beginBatch = () => useCanvasHistoryStore.getState().beginBatch();
export const endBatch = () => useCanvasHistoryStore.getState().endBatch();