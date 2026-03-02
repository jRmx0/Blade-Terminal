import { useEffect, useRef } from "react";
import { useSaveAsModalStore } from "@/features/workspace-manager/stores/saveAsModalStore";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";
import ModalHeader from "@/components/modal/ModalHeader";
import ModalFooterButton from "@/components/modal/ModalFooterButton";

export default function SaveAsModal() {
    const { isOpen, environments, name, selectedEnvId, isSaving, setName, selectEnv, save, close } =
        useSaveAsModalStore();
    const inputRef = useRef<HTMLInputElement>(null);

    useShortcutsBlocked("save-as-modal", isOpen);

    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") close();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, close]);

    useEffect(() => {
        if (isOpen) setTimeout(() => { inputRef.current?.select(); }, 0);
    }, [isOpen]);

    if (!isOpen) return null;

    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    function handleSave() {
        save().catch(console.error);
    }

    const canSave = name.trim().length > 0 && !isSaving;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropClick}
        >
            <div className="flex flex-col w-130 bg-gray-100 rounded-lg shadow-xl overflow-hidden">
                <ModalHeader title="Save As" onClose={close} />

                {/* Workspace list */}
                <div className="flex flex-col mx-4 mt-4">
                    {/* Single scrollable container — header is sticky inside so widths always match */}
                    <ul className="border border-gray-300 bg-white h-52 overflow-y-auto rounded">
                        {/* Sticky column header */}
                        <li className="sticky top-0 flex items-center px-3 py-1 bg-gray-200 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-300 z-10">
                            <span className="flex-1">Name</span>
                            <span className="w-10 text-right">ID</span>
                        </li>
                        {environments.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-400 italic">No saved workspaces</li>
                        ) : (
                            environments.map((env) => {
                                const isSelected = env.id === selectedEnvId;
                                return (
                                    <li key={env.id}>
                                        <button
                                            type="button"
                                            className={`flex items-center w-full px-3 py-1.5 text-sm text-left cursor-pointer transition-colors ${isSelected
                                                ? "bg-blue-500 text-white"
                                                : "hover:bg-gray-100 text-gray-700"
                                                }`}
                                            onClick={() => selectEnv(env.id)}
                                        >
                                            <span className="flex-1 truncate">{env.name}</span>
                                            <span className={`w-10 text-right shrink-0 tabular-nums ${isSelected ? "text-white" : "text-gray-400"
                                                }`}>
                                                {env.id}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>

                {/* File name field */}
                <div className="flex items-center gap-3 px-4 pt-3 pb-1">
                    <label className="text-sm text-gray-600 shrink-0">File name:</label>
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded outline-none focus:border-gray-400 text-gray-700"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && canSave) handleSave();
                        }}
                        placeholder="Enter workspace name"
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3">
                    <ModalFooterButton onClick={close} disabled={isSaving}>
                        Cancel
                    </ModalFooterButton>
                    <ModalFooterButton variant="primary" onClick={handleSave} disabled={!canSave}>
                        {isSaving ? "Saving..." : "Save"}
                    </ModalFooterButton>
                </div>
            </div>
        </div>
    );
}
