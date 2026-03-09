import { useEffect } from "react";
import { useConfirmTypeChangeModalStore } from "@/features/coverage-planning/stores/env-section/confirmTypeChangeModalStore";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";
import ModalTitle from "@/components/modal/ModalTitle";
import ModalFooterButton from "@/components/modal/ModalFooterButton";

export default function ConfirmTypeChangeModal() {
    const { isOpen, message, confirm, cancel } = useConfirmTypeChangeModalStore();

    useShortcutsBlocked("confirm-type-change-modal", isOpen);

    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") cancel();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, cancel]);

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
                <ModalTitle title="Update object types" onClose={cancel} />

                <p className="px-5 pt-3 pb-5 text-sm text-gray-500">
                    {message}
                </p>

                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
                    <ModalFooterButton variant="primary" onClick={confirm}>
                        Confirm
                    </ModalFooterButton>
                    <ModalFooterButton onClick={cancel}>
                        Cancel
                    </ModalFooterButton>
                </div>
            </div>
        </div>
    );
}
