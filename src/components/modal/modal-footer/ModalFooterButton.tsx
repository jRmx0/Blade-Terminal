interface ModalFooterButtonProps {
    onClick: () => void;
    variant?: "default" | "primary" | "warning" | "danger";
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
            : variant === "warning"
                ? "border border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:border-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
                : variant === "danger"
                    ? "border border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
