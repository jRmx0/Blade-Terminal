import { useEffect } from "react";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useSaveModeStore } from "@/stores/saveModeStore";
import { useEnvStore } from "@/stores/envStore";
import { saveEnvironment } from "@server/db/environments";
import { saveEnvObjects, deleteEnvObject } from "@server/db/env-objects";
import { saveEnvVertices, deleteEnvVertex } from "@server/db/env-vertices";

// Module-level guard prevents concurrent saves regardless of which caller triggers it.
let _isSaving = false;

/**
 * Standalone save function — can be called from anywhere (hooks, shortcuts, buttons).
 * Reads current dirty state from stores, persists all changes, then clears dirty flags.
 */
export async function performSave(): Promise<void> {
    if (_isSaving) return;

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

    _isSaving = true;
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
        _isSaving = false;
    }
}


/** Subscribes to canvas store changes and auto-saves when mode is "autosave". */
export function useCanvasAutosave(): void {
    const mode = useSaveModeStore((s) => s.mode);

    useEffect(() => {
        if (mode !== "autosave") return;

        return useCanvasObjectStore.subscribe((next, prev) => {
            if (next.objects === prev.objects && next.vertices === prev.vertices) return;
            void performSave();
        });
    }, [mode]);
}
