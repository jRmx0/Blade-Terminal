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
            ? "border border-gray-500 text-gray-700 font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            : "border border-gray-300 text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer ${styles}`}
        >
            {children}
        </button>
    );
}
