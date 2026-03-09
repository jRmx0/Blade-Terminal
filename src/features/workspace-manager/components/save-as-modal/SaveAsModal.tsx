import { useEffect, useRef } from "react";
import { useSaveAsModalStore } from "@/features/workspace-manager/stores/saveAsModalStore";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";
import ModalTitle from "@/components/modal/ModalTitle";
import ModalFooterButton from "@/components/modal/ModalFooterButton";
import ModalListPart from "@/components/modal/ModalListPart";
import ModalFileNameField from "@/components/modal/ModalFileNameField";
import { useEnvStore } from "@/stores/envStore";

export default function SaveAsModal() {
    const currentEnvId = useEnvStore((s) => s.env.id);
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
            <div
                className="flex flex-col w-130 bg-gray-100 rounded-lg shadow-xl overflow-hidden"
                onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest("button") && !target.closest("input")) {
                        if (selectedEnvId !== null) selectEnv(selectedEnvId);
                    }
                }}
            >
                <ModalTitle title="Save As" onClose={close} />

                {/* Workspace list */}
                <div className="flex flex-col mx-4">
                    <ModalListPart
                        items={environments}
                        selectedId={selectedEnvId}
                        activeId={currentEnvId}
                        onSelect={selectEnv}
                    />
                </div>

                {/* File name field */}
                <ModalFileNameField
                    ref={inputRef}
                    value={name}
                    placeholder="Enter workspace name"
                    onChange={setName}
                    onConfirm={() => { if (canSave) handleSave(); }}
                />

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3">
                    <ModalFooterButton variant="primary" onClick={handleSave} disabled={!canSave}>
                        {isSaving ? "Saving..." : "Save"}
                    </ModalFooterButton>
                    <ModalFooterButton onClick={close} disabled={isSaving}>
                        Cancel
                    </ModalFooterButton>
                </div>
            </div>
        </div>
    );
}
