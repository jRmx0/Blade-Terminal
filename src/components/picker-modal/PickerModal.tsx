import { useEffect, useRef } from "react";
import ModalHeader from "@/components/modal/ModalHeader";
import ModalFooter from "@/components/modal/ModalFooter";
import PickerModalItemSection from "@/components/picker-modal/PickerModalItemSection";

interface PickerModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    isLoading?: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
    onOk?: () => void;
    okLabel?: string;
    onCancel?: () => void;
    cancelLabel?: string;
    children: React.ReactNode;
}

export default function PickerModal({
    isOpen,
    title,
    onClose,
    isLoading = false,
    isEmpty = false,
    emptyMessage = "No items",
    onOk,
    okLabel,
    onCancel,
    cancelLabel,
    children,
}: PickerModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === e.currentTarget) onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropClick}
        >
            <div
                ref={dialogRef}
                className="flex flex-col w-120 max-h-[60vh] bg-gray-100 rounded-lg shadow-xl overflow-hidden"
            >
                <ModalHeader title={title} onClose={onClose} />

                <PickerModalItemSection>
                    {isLoading ? (
                        <p className="px-5 py-6 text-sm text-gray-500 text-center">Loading…</p>
                    ) : isEmpty ? (
                        <p className="px-5 py-6 text-sm text-gray-400 text-center">{emptyMessage}</p>
                    ) : (
                        <ul>{children}</ul>
                    )}
                </PickerModalItemSection>

                {(onOk || onCancel) && (
                    <ModalFooter
                        onOk={onOk}
                        okLabel={okLabel}
                        onCancel={onCancel}
                        cancelLabel={cancelLabel}
                    />
                )}
            </div>
        </div>
    );
}
