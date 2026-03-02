interface ModalFooterButtonProps {
    onClick: () => void;
    variant?: "default" | "primary";
    children: React.ReactNode;
}

export default function ModalFooterButton({
    onClick,
    variant = "default",
    children,
}: ModalFooterButtonProps) {
    const styles =
        variant === "primary"
            ? "border border-gray-400 text-gray-600 hover:bg-blue-200 bg-blue-100"
            : "border border-gray-400 text-gray-600 hover:bg-gray-200";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer ${styles}`}
        >
            {children}
        </button>
    );
}
