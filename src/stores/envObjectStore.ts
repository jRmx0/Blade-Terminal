import { create } from "zustand";
import { OBJECT_TYPE } from "@/config/enums";
import type { ObjectCategory } from "@/config/enums";
import type { EnvObject } from "@/types/envTypes";
import { useEnvStore } from "@/stores/envStore";

let _idCounter = 0;
function nextId() {
    return `obj-${++_idCounter}`;
}

interface EnvObjectState {
    objects: EnvObject[];

    /**
     * Creates a new object belonging to the given environment.
     * Also increments the corresponding count on envStore.
     * Returns the new object's id.
     */
    addObject: (environmentId: string, category: ObjectCategory) => string;

    /**
     * Removes an object by id.
     * Also decrements the corresponding count on envStore.
     */
    deleteObject: (id: string) => void;

    /**
     * Called by envVertexStore after any vertex mutation to keep
     * vertexCount and area in sync without envObjectStore knowing about vertices.
     */
    updateCachedFields: (id: string, vertexCount: number, area: number) => void;
}

export const useEnvObjectStore = create<EnvObjectState>((set, get) => ({
    objects: [],

    addObject: (environmentId, category) => {
        const id = nextId();
        const newObject: EnvObject = {
            id,
            environmentId,
            category,
            type: OBJECT_TYPE.OFFLINE,
            vertexCount: 0,
            area: 0,
        };
        set((state) => ({ objects: [...state.objects, newObject] }));

        const { incrementZoneCount, incrementObstacleCount } = useEnvStore.getState();
        if (category === "zone") incrementZoneCount();
        else incrementObstacleCount();

        return id;
    },

    deleteObject: (id) => {
        const obj = get().objects.find((o) => o.id === id);
        set((state) => ({ objects: state.objects.filter((o) => o.id !== id) }));

        if (obj) {
            const { decrementZoneCount, decrementObstacleCount } = useEnvStore.getState();
            if (obj.category === "zone") decrementZoneCount();
            else decrementObstacleCount();
        }
    },

    updateCachedFields: (id, vertexCount, area) =>
        set((state) => ({
            objects: state.objects.map((o) =>
                o.id === id ? { ...o, vertexCount, area } : o
            ),
        })),
}));
