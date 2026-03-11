import { useEffect } from "react";
import { useSaveModalStore } from "@/features/workspace-manager/stores/saveModalStore";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";
import ModalTitle from "@/components/modal/modal-title/ModalTitle";
import ModalFooterButton from "@/components/modal/modal-footer/ModalFooterButton";

export default function SaveModal() {
    const { isOpen, saveAndContinue, discardAndContinue, cancel } = useSaveModalStore();

    useShortcutsBlocked("save-modal", isOpen);

    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") cancel();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    if (!isOpen) return null;

    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === e.currentTarget) cancel();
    }

    return (
        <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropClick}
        >
            <div className="flex flex-col w-100 bg-gray-100 rounded-lg shadow-xl overflow-hidden">
                <ModalTitle title="Unsaved Changes" onClose={cancel} />

                <p className="px-5 pt-3 pb-5 text-sm text-gray-500">
                    Your changes will be lost if you don't save them.
                </p>

                <div className="flex items-center justify-end gap-2 px-4 py-3 border-gray-200">
                    <ModalFooterButton variant="primary" onClick={() => saveAndContinue().catch(console.error)}>
                        Save
                    </ModalFooterButton>
                    <ModalFooterButton onClick={() => discardAndContinue().catch(console.error)}>
                        Don't Save
                    </ModalFooterButton>
                    <ModalFooterButton onClick={cancel}>
                        Cancel
                    </ModalFooterButton>
                </div>
            </div>
        </div>
    );
}
