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
    const { mode, markSaved } = useSaveModeStore();

    const save = useCallback(async () => {
        if (isSavingRef.current) return;

        const { objects, vertices, dirtyObjectIds, dirtyVertexIds, deletedObjectIds, deletedVertexIds, clearDirty } =
            useCanvasObjectStore.getState();

        const hasDirty =
            dirtyObjectIds.size > 0 ||
            dirtyVertexIds.size > 0 ||
            deletedObjectIds.size > 0 ||
            deletedVertexIds.size > 0;

        if (!hasDirty) return;

        isSavingRef.current = true;
        setIsSaving(true);

        try {
            const env = useEnvStore.getState().env;
            const dirtyObjects = objects.filter((o) => dirtyObjectIds.has(o.id));
            const dirtyVerts = vertices.filter((v) => dirtyVertexIds.has(v.id));

            await Promise.all([
                saveEnvironment(env),
                dirtyObjects.length > 0 ? saveEnvObjects(dirtyObjects) : Promise.resolve(),
                dirtyVerts.length > 0 ? saveEnvVertices(dirtyVerts) : Promise.resolve(),
                ...[...deletedObjectIds].map(deleteEnvObject),
                ...[...deletedVertexIds].map(deleteEnvVertex),
            ]);

            clearDirty();
            markSaved();
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    }, [markSaved]);

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
