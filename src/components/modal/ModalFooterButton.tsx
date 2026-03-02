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
            ? "border border-gray-500 text-gray-700 font-medium hover:bg-gray-200"
            : "border border-gray-300 text-gray-500 hover:bg-gray-200";

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
