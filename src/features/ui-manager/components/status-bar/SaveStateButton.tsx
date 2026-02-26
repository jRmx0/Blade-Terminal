import { useSaveModeStore } from "@/stores/saveModeStore";

export default function SaveStateButton() {
    const mode = useSaveModeStore((state) => state.mode);
    const isDirty = useSaveModeStore((state) => state.isDirty);
    const markSaved = useSaveModeStore((state) => state.markSaved);

    const isSaved = mode === "autosave" || (mode === "manual" && !isDirty);
    const tooltip = isSaved ? "Saved" : "Unsaved changes. Click here to save";

    function handleClick() {
        if (!isSaved) markSaved();
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
