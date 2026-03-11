import ModalSystemActions from "@/components/modal/modal-header/ModalSystemActions";

export type ModalSavedState = "saved" | "unsaved" | "nothing_to_save";

interface ModalHeaderProps {
    recordId: number | null;
    recordName: string;
    savedState: ModalSavedState;
    onSave: () => void;
    canSave?: boolean;
    isEditMode: boolean;
    onEdit: () => void;
    onNew: () => void;
    onDelete: () => void;
    canDelete?: boolean;
}

function SavedStateButton({
    savedState,
    onSave,
    canSave = true,
}: {
    savedState: ModalSavedState;
    onSave: () => void;
    canSave?: boolean;
}) {
    if (savedState === "nothing_to_save") return null;

    const isUnsaved = savedState === "unsaved";
    const isSaveEnabled = isUnsaved && canSave;

    return (
        <button
            type="button"
            onClick={isSaveEnabled ? onSave : undefined}
            disabled={!isSaveEnabled}
            title={savedState === "saved" ? "All changes saved" : canSave ? "Save changes" : "Fill required fields to save"}
            className={[
                "flex items-center gap-1 px-2 py-0.5 rounded text-sm transition-colors",
                isSaveEnabled
                    ? "text-amber-600 hover:bg-amber-50 cursor-pointer"
                    : isUnsaved
                        ? "text-amber-500 opacity-70 cursor-not-allowed"
                        : "text-gray-500 cursor-default",
            ].join(" ")}
        >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {isUnsaved ? "save" : "check_circle"}
            </span>
            {isUnsaved ? "Unsaved" : "Saved"}
        </button>
    );
}

export default function ModalHeader({
    recordId,
    recordName,
    savedState,
    onSave,
    canSave = true,
    isEditMode,
    onEdit,
    onNew,
    onDelete,
    canDelete = true,
}: ModalHeaderProps) {
    return (
        <div className="flex items-center px-5 pb-1 bg-gray-100 select-none shrink-0">
            {/* Left: id · name */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {recordId !== null && (
                    <>
                        <span className="text-lg text-gray-700 shrink-0">{recordId}</span>
                        <span className="text-lg font-bold text-gray-400">·</span>
                    </>
                )}
                <span className="text-lg text-gray-700 truncate">
                    {recordName || <span className="text-gray-400 italic">New record</span>}
                </span>
            </div>

            {/* Middle: system actions — truly centered */}
            <div className="flex items-center justify-center flex-1">
                <ModalSystemActions
                    isEditMode={isEditMode}
                    onEdit={onEdit}
                    onNew={onNew}
                    onDelete={onDelete}
                    canDelete={canDelete}
                />
            </div>

            {/* Right: save state */}
            <div className="flex items-center justify-end flex-1">
                <SavedStateButton savedState={savedState} onSave={onSave} canSave={canSave} />
            </div>
        </div>
    );
}
