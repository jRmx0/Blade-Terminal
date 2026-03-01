import { useEnvStore } from "@/stores/envStore";
import { useSaveModeStore } from "@/stores/saveModeStore";
import { useCanvasObjectStore, selectIsDirty } from "@/features/canvas-editing/stores/canvasObjectStore";
import { performSave } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasSave";

export default function SaveStateButton() {
    const isEnvDirty = useEnvStore((state) => state.isEnvDirty);
    const mode = useSaveModeStore((state) => state.mode);
    const { setMode } = useSaveModeStore();
    const isCanvasDirty = useCanvasObjectStore(selectIsDirty);

    const isDirty = isEnvDirty || isCanvasDirty;
    const isSaved = mode === "autosave" || (mode === "manual" && !isDirty);
    const tooltip = isSaved ? "Saved" : "Unsaved changes. Click here to save";

    function handleClick() {
        if (!isSaved) {
            performSave()
                .then(() => {
                    if (mode === "session") setMode("manual");
                })
                .catch(console.error);
        }
    }

    return (
        <button
            type="button"
            title={tooltip}
            onClick={handleClick}
            className={`flex items-center gap-1 h-5 px-1.5 rounded text-xs  cursor-pointer select-none transition-colors ${isSaved
                ? "text-gray-600 hover:bg-gray-200"
                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSaved ? "bg-green-500" : "bg-amber-500"}`} />
            {isSaved ? "Saved" : "Unsaved changes"}
        </button>
    );
}
