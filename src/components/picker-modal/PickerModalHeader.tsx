interface PickerModalHeaderProps {
    title: string;
    onClose: () => void;
}

export default function PickerModalHeader({ title, onClose }: PickerModalHeaderProps) {
    return (
        <div className="flex items-center justify-between px-5 py-2 border-b border-gray-200 select-none">
            <span className="text-sm font-semibold text-gray-700 tracking-wide uppercase">
                {title}
            </span>
            <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white hover:bg-red-600 transition-colors text-lg leading-none px-1.5 py-1.5 rounded"
                title="Close"
            >
                ✕
            </button>
        </div>
    );
}
