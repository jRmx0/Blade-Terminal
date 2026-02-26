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

    addObject: (category: ObjectCategory, points: { x: number; y: number }[], type: ObjectType) => void;
    deleteObject: (id: string) => void;
    updateVertex: (objectId: string, vertexIndex: number, x: number, y: number) => void;
    moveObject: (objectId: string, dx: number, dy: number) => void;
    deleteVertex: (objectId: string, vertexIndex: number) => void;
    deleteVertices: (objectId: string, indices: number[]) => void;
    insertVertex: (objectId: string, afterIndex: number, x: number, y: number) => string;
}

export const useCanvasObjectStore = create<CanvasObjectState>()((set) => ({
    objects: SAMPLE_OBJECTS,

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
        })),

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

    moveObject: (objectId, dx, dy) =>
        set((state) => ({
            objects: state.objects.map((o) => {
                if (o.id !== objectId) return o;
                return {
                    ...o,
                    vertices: o.vertices.map((v) => ({ ...v, x: v.x + dx, y: v.y + dy })),
                };
            }),
        })),

    deleteVertex: (objectId, vertexIndex) =>
        set((state) => ({
            objects: state.objects.map((o) => {
                if (o.id !== objectId) return o;
                if (o.vertices.length <= 3) return o;
                return {
                    ...o,
                    vertices: o.vertices.filter((_, i) => i !== vertexIndex),
                };
            }),
        })),

    deleteVertices: (objectId, indices) =>
        set((state) => ({
            objects: state.objects.map((o) => {
                if (o.id !== objectId) return o;
                const remaining = o.vertices.length - indices.length;
                if (remaining < 3) return o;
                const indexSet = new Set(indices);
                return {
                    ...o,
                    vertices: o.vertices.filter((_, i) => !indexSet.has(i)),
                };
            }),
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
        }));
        return newId;
    },
}));
