import { useEffect } from "react";
import { useCanvasObjectStore, selectIsDirty } from "@/features/canvas-editing/stores/canvasObjectStore";
import { saveCanvas } from "@/features/canvas-editing/data/canvasBridge";

/**
 * Subscribes to canvas object changes and triggers an autosave whenever the
 * canvas becomes dirty. Relies on `saveCanvas` in canvasBridge to respect
 * the current save mode and the in-progress guard.
 *
 * Mount once inside `CanvasEditor` or a similar root canvas component.
 */
export function useCanvasAutosave(): void {
    useEffect(() => {
        return useCanvasObjectStore.subscribe((state, prev) => {
            if (selectIsDirty(state) && !selectIsDirty(prev)) {
                saveCanvas().catch(console.error);
            }
        });
    }, []);
}
