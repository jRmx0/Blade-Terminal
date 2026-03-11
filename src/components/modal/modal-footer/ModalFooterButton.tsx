interface ModalFooterButtonProps {
    onClick: () => void;
    variant?: "default" | "primary";
    disabled?: boolean;
    children: React.ReactNode;
}

export default function ModalFooterButton({
    onClick,
    variant = "default",
    disabled = false,
    children,
}: ModalFooterButtonProps) {
    const styles =
        variant === "primary"
            ? "border border-teal-600 bg-teal-600 text-white hover:bg-teal-700 hover:border-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
            : "border border-gray-300 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`px-3 py-1 rounded font-medium text-sm transition-colors cursor-pointer ${styles}`}
        >
            {children}
        </button>
    );
}
