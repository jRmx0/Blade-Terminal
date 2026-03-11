import { useEffect } from "react";
import ModalFooterButton from "@/components/modal/modal-footer/ModalFooterButton";
import ModalTitle from "@/components/modal/modal-title/ModalTitle";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";
import { useConfirmationModalStore } from "@/stores/confirmationModalStore";

export default function ConfirmationModal() {
    const {
        isOpen,
        title,
        message,
        confirmLabel,
        cancelLabel,
        secondaryLabel,
        confirmDisabled,
        confirm,
        secondary,
        cancel,
    } = useConfirmationModalStore();

    useShortcutsBlocked("confirmation-modal", isOpen);

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
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropClick}
        >
            <div className="flex flex-col w-100 bg-gray-100 rounded-lg shadow-xl overflow-hidden">
                <ModalTitle title={title} onClose={cancel} />

                <p className="px-5 pt-3 pb-5 text-sm text-gray-500 whitespace-pre-wrap">
                    {message}
                </p>

                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
                    <ModalFooterButton variant="primary" disabled={confirmDisabled} onClick={() => confirm().catch(console.error)}>
                        {confirmLabel}
                    </ModalFooterButton>
                    {secondaryLabel && (
                        <ModalFooterButton onClick={() => secondary().catch(console.error)}>
                            {secondaryLabel}
                        </ModalFooterButton>
                    )}
                    <ModalFooterButton onClick={cancel}>
                        {cancelLabel}
                    </ModalFooterButton>
                </div>
            </div>
        </div>
    );
}
