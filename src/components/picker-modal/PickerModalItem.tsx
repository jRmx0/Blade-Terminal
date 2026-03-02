interface PickerModalItemProps {
    label: string;
    subLabel?: string;
    onOpen: () => void;
    onDelete: () => void;
    isActive?: boolean;
}

export default function PickerModalItem({ label, subLabel, onOpen, onDelete, isActive = false }: PickerModalItemProps) {
    return (
        <li className={`flex items-center group transition-colors ${isActive ? "bg-gray-200" : "hover:bg-gray-200 active:bg-gray-300"}`}>
            <button
                type="button"
                onClick={onOpen}
                disabled={isActive}
                className={`flex-1 flex flex-col min-w-0 px-5 py-3 text-left ${isActive ? "cursor-default" : "cursor-pointer"}`}
            >
                <span className={`text-sm font-medium truncate ${isActive ? "text-gray-500" : "text-gray-800 group-hover:underline"}`}>
                    {label}
                    {isActive && (
                        <span className="ml-2 text-xs font-normal text-gray-400">(current)</span>
                    )}
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
