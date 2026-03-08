import { useState } from "react";
import { createPortal } from "react-dom";

interface ModalListPartItem {
    id: number;
    name: string;
}

export interface ModalListPartAction {
    icon: string;
    title: string;
    onClick: (id: number) => void;
    /** "danger" = red text, "default" = gray text. Defaults to "default". */
    variant?: "danger" | "default";
}

interface ModalListPartProps {
    items: ModalListPartItem[];
    selectedId?: number | null;
    onSelect?: (id: number) => void;
    /** Id of the currently active/loaded item — its name is rendered bold. */
    activeId?: number | null;
    /** When provided, a more_vert button appears on row hover/select opening a dropdown. */
    actions?: ModalListPartAction[];
    /** Fires when a row is double-clicked or the name is clicked. */
    onDoubleClick?: (id: number) => void;
    /** Tooltip shown on the name when onDoubleClick is provided. Defaults to "View". */
    doubleClickLabel?: string;
    emptyMessage?: string;
}

export default function ModalListPart({
    items,
    selectedId,
    onSelect,
    activeId,
    actions = [],
    onDoubleClick,
    doubleClickLabel = "View",
    emptyMessage = "No items",
}: ModalListPartProps) {
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const hasActions = actions.length > 0 || !!onDoubleClick;

    function handleMoreClick(e: React.MouseEvent<HTMLButtonElement>, itemId: number) {
        e.stopPropagation();
        if (itemId !== selectedId) onSelect?.(itemId);
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 2, left: rect.left });
        setOpenMenuId(itemId);
    }

    return (
        <>
            <ul className="border border-gray-300 bg-white h-52 overflow-y-auto rounded">
                {/* Sticky column header */}
                <li className="sticky top-0 flex items-center px-3 py-1 bg-gray-200 text-sm font-bold text-gray-700 tracking-wider border-b border-gray-300 z-10 cursor-default">
                    <span className="flex-1">Name</span>
                    {hasActions && <span className="w-6" />}
                    <span className="w-10 text-right">ID</span>
                </li>

                {items.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-400 italic">{emptyMessage}</li>
                ) : (
                    items.map((item) => {
                        const isSelected = item.id === selectedId;
                        const isActive = item.id === activeId;
                        const isMenuOpen = openMenuId === item.id;
                        return (
                            <li key={item.id} className={`group flex items-stretch ${isSelected ? "bg-teal-600" : "hover:bg-gray-100"}`}>
                                <button
                                    type="button"
                                    className={`flex-1 flex items-center pl-3 py-1.5 text-sm text-left cursor-pointer ${isSelected ? "text-white" : "text-gray-700"} ${isActive ? "font-medium" : ""}`}
                                    onClick={(e) => { e.stopPropagation(); onSelect?.(item.id); }}
                                    onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(item.id); }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <span className="flex-1 truncate min-w-0">
                                        <span
                                            className={onDoubleClick ? "hover:underline cursor-pointer" : ""}
                                            title={onDoubleClick ? doubleClickLabel : onSelect ? "Select" : undefined}
                                            onClick={onDoubleClick ? (e) => { e.stopPropagation(); onDoubleClick(item.id); } : undefined}
                                        >
                                            {item.name || <span className="italic text-gray-400">Unnamed</span>}
                                        </span>
                                    </span>
                                </button>
                                {hasActions && (
                                    <button
                                        type="button"
                                        className={`w-6 flex items-center justify-center rounded transition-opacity cursor-pointer ${isSelected ? `text-white bg-teal-700` : `text-gray-600 bg-gray-200`} ${isMenuOpen ? "opacity-100" : isSelected ? "text-teal-100 bg-transparent hover:text-white hover:bg-teal-700" : "text-gray-400 bg-transparent hover:text-gray-600 hover:bg-gray-200"} ${isSelected || isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                        onClick={(e) => handleMoreClick(e, item.id)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        title="Actions"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_vert</span>
                                    </button>
                                )}
                                <span className={`w-10 pr-3 flex items-center justify-end text-sm tabular-nums shrink-0 ${isSelected ? "text-white" : "text-gray-700"}`}>
                                    {item.id}
                                </span>
                            </li>
                        );
                    })
                )}
            </ul>

            {openMenuId !== null && menuPos && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-55"
                        onMouseDown={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                    />
                    <div
                        style={{ top: menuPos.top, left: menuPos.left }}
                        className="fixed z-58 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-36"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {onDoubleClick && (
                            <button
                                type="button"
                                className="flex items-center gap-2 w-full px-3 py-1 text-sm text-left text-gray-700 cursor-pointer transition-colors hover:bg-gray-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDoubleClick(openMenuId);
                                    setOpenMenuId(null);
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                                {doubleClickLabel}
                            </button>
                        )}
                        {actions.map((action) => (
                            <button
                                key={action.title}
                                type="button"
                                className={`flex items-center gap-2 w-full px-3 py-1 text-sm text-left cursor-pointer transition-colors hover:bg-gray-100 ${action.variant === "danger" ? "text-red-600" : "text-gray-700"}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(openMenuId);
                                    setOpenMenuId(null);
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{action.icon}</span>
                                {action.title}
                            </button>
                        ))}
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
