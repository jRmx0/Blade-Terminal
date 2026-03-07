import { useEffect } from "react";
import { useDeleteModalStore } from "@/features/workspace-manager/stores/deleteModalStore";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";
import ModalHeader from "@/components/modal/ModalHeader";
import ModalFooterButton from "@/components/modal/ModalFooterButton";

export default function DeleteModal() {
    const { isOpen, envName, confirm, cancel } = useDeleteModalStore();

    useShortcutsBlocked("delete-modal", isOpen);

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropClick}
        >
            <div className="flex flex-col w-80 bg-gray-100 rounded-lg shadow-xl overflow-hidden">
                <ModalHeader title="Delete workspace" onClose={cancel} />

                <p className="px-5 pt-3 pb-5 text-sm text-gray-500">
                    Delete <span className="font-medium text-gray-700">{envName}</span>? This cannot be undone.
                </p>

                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
                    <ModalFooterButton variant="primary" onClick={() => confirm().catch(console.error)}>
                        Delete
                    </ModalFooterButton>
                    <ModalFooterButton onClick={cancel}>
                        Cancel
                    </ModalFooterButton>
                </div>
            </div>
        </div>
    );
}
