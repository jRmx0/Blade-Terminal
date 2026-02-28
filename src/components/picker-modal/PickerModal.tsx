import { useEffect, useRef } from "react";
import PickerModalHeader from "@/components/picker-modal/PickerModalHeader";

interface PickerModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    isLoading?: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
    children: React.ReactNode;
}

export default function PickerModal({
    isOpen,
    title,
    onClose,
    isLoading = false,
    isEmpty = false,
    emptyMessage = "No items",
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
                <PickerModalHeader title={title} onClose={onClose} />

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <p className="px-5 py-6 text-sm text-gray-500 text-center">Loading…</p>
                    ) : isEmpty ? (
                        <p className="px-5 py-6 text-sm text-gray-400 text-center">{emptyMessage}</p>
                    ) : (
                        <ul>{children}</ul>
                    )}
                </div>
            </div>
        </div>
    );
}
