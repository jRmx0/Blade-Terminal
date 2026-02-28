interface PickerModalItemProps {
    label: string;
    subLabel?: string;
    onOpen: () => void;
    onDelete: () => void;
}

export default function PickerModalItem({ label, subLabel, onOpen, onDelete }: PickerModalItemProps) {
    return (
        <li className="flex items-center group hover:bg-gray-200 active:bg-gray-300 transition-colors">
            <button
                type="button"
                onClick={onOpen}
                className="flex-1 flex flex-col min-w-0 px-5 py-3 text-left"
            >
                <span className="text-sm font-medium text-gray-800 truncate">
                    {label}
                </span>
                {subLabel && (
                    <span className="text-xs text-gray-400 truncate">{subLabel}</span>
                )}
            </button>
            <button
                type="button"
                title="Delete"
                onClick={onDelete}
                className="mr-5 shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-300 hover:text-red-500 transition-colors cursor-pointer"
            >
                <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
        </li>
    );
}
