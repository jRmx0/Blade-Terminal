import { create } from "zustand";
import type { CanvasObject, CanvasVertex, ObjectCategory, ObjectType } from "@/features/canvas-editing/types/canvas";

let _idCounter = 1000;
function nextId() {
    return String(++_idCounter);
}

function makeVertex(x: number, y: number): CanvasVertex {
    return { id: nextId(), x, y };
}

const SAMPLE_OBJECTS: CanvasObject[] = [
    {
        id: "sample-zone-1",
        category: "zone",
        type: "off-line",
        vertices: [
            makeVertex(120, 100),
            makeVertex(320, 100),
            makeVertex(320, 260),
            makeVertex(120, 260),
        ],
    },
    {
        id: "sample-obstacle-1",
        category: "obstacle",
        type: "off-line",
        vertices: [
            makeVertex(180, 150),
            makeVertex(260, 150),
            makeVertex(260, 210),
        ],
    },
];

interface CanvasObjectState {
    objects: CanvasObject[];
    selectedObjectId: string | null;
    selectedVertexIndex: number | null;

    addObject: (category: ObjectCategory, points: { x: number; y: number }[], type: ObjectType) => void;
    deleteObject: (id: string) => void;
    selectObject: (id: string) => void;
    clearSelection: () => void;
    selectVertex: (index: number | null) => void;
    updateVertex: (objectId: string, vertexIndex: number, x: number, y: number) => void;
    deleteVertex: (objectId: string, vertexIndex: number) => void;
    insertVertex: (objectId: string, afterIndex: number, x: number, y: number) => string;
}

export const useCanvasObjectStore = create<CanvasObjectState>((set, get) => ({
    objects: SAMPLE_OBJECTS,
    selectedObjectId: null,
    selectedVertexIndex: null,

    addObject: (category, points, type) =>
        set((state) => ({
            objects: [
                ...state.objects,
                {
                    id: nextId(),
                    category,
                    type,
                    vertices: points.map((p) => makeVertex(p.x, p.y)),
                },
            ],
        })),

    deleteObject: (id) =>
        set((state) => ({
            objects: state.objects.filter((o) => o.id !== id),
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
            selectedVertexIndex:
                state.selectedObjectId === id ? null : state.selectedVertexIndex,
        })),

    selectObject: (id) =>
        set({ selectedObjectId: id, selectedVertexIndex: null }),

    clearSelection: () =>
        set({ selectedObjectId: null, selectedVertexIndex: null }),

    selectVertex: (index) => set({ selectedVertexIndex: index }),

    updateVertex: (objectId, vertexIndex, x, y) =>
        set((state) => ({
            objects: state.objects.map((o) => {
                if (o.id !== objectId) return o;
                const vertices = o.vertices.map((v, i) =>
                    i === vertexIndex ? { ...v, x, y } : v
                );
                return { ...o, vertices };
            }),
        })),

    deleteVertex: (objectId, vertexIndex) =>
        set((state) => ({
            objects: state.objects.map((o) => {
                if (o.id !== objectId) return o;
                if (o.vertices.length <= 3) return o; // guard: minimum 3 vertices
                return {
                    ...o,
                    vertices: o.vertices.filter((_, i) => i !== vertexIndex),
                };
            }),
            selectedVertexIndex: null,
        })),

    insertVertex: (objectId, afterIndex, x, y) => {
        const newId = nextId();
        set((state) => ({
            objects: state.objects.map((o) => {
                if (o.id !== objectId) return o;
                const newVertex: CanvasVertex = { id: newId, x, y };
                const vertices = [
                    ...o.vertices.slice(0, afterIndex + 1),
                    newVertex,
                    ...o.vertices.slice(afterIndex + 1),
                ];
                return { ...o, vertices };
            }),
            selectedVertexIndex: afterIndex + 1,
        }));
        return newId;
    },
}));
