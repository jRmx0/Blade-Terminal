import { create } from "zustand";
import { OBJECT_TYPE } from "@/config/db-ops/enums";
import type { ObjectCategory } from "@/config/db-ops/enums";
import type { EnvObject } from "@/types/envTypes";
import { useEnvStore } from "@/stores/envStore";
import { getSaveMode } from "@/stores/saveModeStore";
import {
    saveEnvObject,
    saveEnvObjects,
    deleteEnvObject as dbDeleteEnvObject,
    getEnvObjectsByEnvironment,
} from "@server/db/env-objects";

let _idCounter = 0;
function nextId(): number {
    return ++_idCounter;
}

interface EnvObjectState {
    objects: EnvObject[];

    /**
     * Creates a new object belonging to the given environment.
     * Also increments the corresponding count on envStore.
     * Returns the new object's id.
     */
    addObject: (environmentId: number, category: ObjectCategory) => number;

    /**
     * Removes an object by id.
     * Also decrements the corresponding count on envStore.
     */
    deleteObject: (id: number) => void;

    /**
     * Called by envVertexStore after any vertex mutation to keep
     * vertexCount and area in sync without envObjectStore knowing about vertices.
     */
    updateCachedFields: (id: number, vertexCount: number, area: number) => void;

    /** Manual save: persists all current objects to IndexedDB. */
    save: () => Promise<void>;

    /** Loads all objects for the given environment from IndexedDB. */
    loadByEnvironment: (environmentId: number) => Promise<void>;
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

        if (getSaveMode() === "autosave") saveEnvObject(newObject).catch(console.error);

        return id;
    },

    deleteObject: (id) => {
        const obj = get().objects.find((o) => o.id === id);
        set((state) => ({ objects: state.objects.filter((o) => o.id !== id) }));

        if (obj) {
            const { decrementZoneCount, decrementObstacleCount } = useEnvStore.getState();
            if (obj.category === "zone") decrementZoneCount();
            else decrementObstacleCount();

            if (getSaveMode() === "autosave") dbDeleteEnvObject(id, useEnvStore.getState().env.id).catch(console.error);
        }
    },

    updateCachedFields: (id, vertexCount, area) => {
        set((state) => ({
            objects: state.objects.map((o) =>
                o.id === id ? { ...o, vertexCount, area } : o
            ),
        }));
        if (getSaveMode() === "autosave") {
            const obj = get().objects.find((o) => o.id === id);
            if (obj) saveEnvObject(obj).catch(console.error);
        }
    },

    save: async () => {
        await saveEnvObjects(get().objects);
    },

    loadByEnvironment: async (environmentId) => {
        const objects = await getEnvObjectsByEnvironment(environmentId);
        set({ objects });
    },
}));
