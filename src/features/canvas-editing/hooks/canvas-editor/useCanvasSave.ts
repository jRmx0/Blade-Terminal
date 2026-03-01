import { useCallback, useEffect, useRef, useState } from "react";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useSaveModeStore } from "@/stores/saveModeStore";
import { useEnvStore } from "@/stores/envStore";
import { saveEnvironment } from "@server/db/environments";
import { saveEnvObjects, deleteEnvObject } from "@server/db/env-objects";
import { saveEnvVertices, deleteEnvVertex } from "@server/db/env-vertices";

export interface UseCanvasSaveResult {
    save: () => Promise<void>;
    isSaving: boolean;
}

export function useCanvasSave(): UseCanvasSaveResult {
    const [isSaving, setIsSaving] = useState(false);
    const isSavingRef = useRef(false);
    const { mode } = useSaveModeStore();

    const save = useCallback(async () => {
        if (isSavingRef.current) return;

        const { objects, vertices, dirtyObjectIds, dirtyVertexIds, deletedObjectIds, deletedVertexIds, clearDirty } =
            useCanvasObjectStore.getState();
        const { env, isEnvDirty, clearEnvDirty } = useEnvStore.getState();

        const hasDirty =
            isEnvDirty ||
            dirtyObjectIds.size > 0 ||
            dirtyVertexIds.size > 0 ||
            deletedObjectIds.size > 0 ||
            deletedVertexIds.size > 0;

        if (!hasDirty) return;

        isSavingRef.current = true;
        setIsSaving(true);

        try {
            const dirtyObjects = objects.filter((o) => dirtyObjectIds.has(o.id));
            const dirtyVerts = vertices.filter((v) => dirtyVertexIds.has(v.id));

            await Promise.all([
                saveEnvironment(env),
                dirtyObjects.length > 0 ? saveEnvObjects(dirtyObjects) : Promise.resolve(),
                dirtyVerts.length > 0 ? saveEnvVertices(dirtyVerts) : Promise.resolve(),
                ...[...deletedObjectIds].map((id) => deleteEnvObject(id, env.id)),
                ...[...deletedVertexIds.entries()].map(([id, objectId]) => deleteEnvVertex(id, objectId)),
            ]);

            clearDirty();
            clearEnvDirty();
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    }, []);

    // Autosave: fire after every store change when mode is "autosave"
    useEffect(() => {
        if (mode !== "autosave") return;

        const unsub = useCanvasObjectStore.subscribe((next, prev) => {
            if (next.objects === prev.objects && next.vertices === prev.vertices) return;
            void save();
        });

        return unsub;
    }, [mode, save]);

    return { save, isSaving };
}
