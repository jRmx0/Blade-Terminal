import { useEffect, useState, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import ModalTitle from "@/components/modal/modal-title/ModalTitle";
import InternalListModalRepeater from "./internal/InternalListModalRepeater";
import InternalListModalInputField from "./internal/InternalListModalInputField";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";

export interface ListModalItem {
    id: number;
    name: string;
}

export interface ListModalAction {
    icon: string;
    title: string;
    onClick: (id: number) => void;
    variant?: "danger" | "default";
}

interface ListModalInputFieldConfig {
    inputRef?: Ref<HTMLInputElement>;
    label?: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    onConfirm?: () => void;
}

interface ListModalProps {
    isOpen: boolean;
    title: string;
    shortcutToken: string;
    onClose: () => void;
    items: ListModalItem[];
    selectedId?: number | null;
    activeId?: number | null;
    onSelect?: (id: number) => void;
    onDoubleClick?: (id: number) => void;
    doubleClickLabel?: string;
    actions?: ListModalAction[];
    emptyMessage?: string;
    isLoading?: boolean;
    loadingMessage?: string;
    onClearSelection?: () => void;
    leadingAction?: ReactNode;
    footerActions?: ReactNode;
    inputField?: ListModalInputFieldConfig;
    children?: ReactNode;
    widthClassName?: string;
}

export default function ListModal({
    isOpen,
    title,
    shortcutToken,
    onClose,
    items,
    selectedId,
    activeId,
    onSelect,
    onDoubleClick,
    doubleClickLabel = "Open",
    actions = [],
    emptyMessage = "No items",
    isLoading = false,
    loadingMessage = "Loading...",
    onClearSelection,
    leadingAction,
    footerActions,
    inputField,
    children,
    widthClassName = "w-130",
}: ListModalProps) {
    useShortcutsBlocked(shortcutToken, isOpen);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const hasActions = actions.length > 0 || !!onDoubleClick;

    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setOpenMenuId(null);
            setMenuPos(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    function handleMoreClick(e: React.MouseEvent<HTMLButtonElement>, itemId: number) {
        e.stopPropagation();
        if (itemId !== selectedId) onSelect?.(itemId);
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 2, left: rect.left });
        setOpenMenuId(itemId);
    }

    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    function handlePanelMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        if (!onClearSelection) return;

        const target = e.target as HTMLElement;
        const interactiveTarget = target.closest("button, input, textarea, select, [data-list-modal-keep-selection='true']");

        if (!interactiveTarget) {
            onClearSelection();
        }
    }

    const hasFooter = Boolean(leadingAction) || Boolean(footerActions);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropClick}
        >
            <div
                className={`flex flex-col ${widthClassName} bg-gray-100 rounded-lg shadow-xl overflow-hidden`}
                onMouseDown={handlePanelMouseDown}
            >
                <ModalTitle title={title} onClose={onClose} />

                <InternalListModalRepeater>
                    {isLoading ? (
                        <div className="border border-gray-300 bg-white h-52 rounded flex items-center justify-center text-sm text-gray-400 italic">
                            {loadingMessage}
                        </div>
                    ) : (
                        <>
                            <ul className="border border-gray-300 bg-white h-52 overflow-y-auto rounded">
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
                                                        className={`w-6 flex items-center justify-center rounded transition-opacity cursor-pointer ${isSelected ? "text-white bg-teal-700" : "text-gray-600 bg-gray-200"} ${isMenuOpen ? "opacity-100" : isSelected ? "text-teal-100 bg-transparent hover:text-white hover:bg-teal-700" : "text-gray-400 bg-transparent hover:text-gray-600 hover:bg-gray-200"} ${isSelected || isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
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
                                document.body,
                            )}
                        </>
                    )}
                </InternalListModalRepeater>

                {inputField ? (
                    <InternalListModalInputField
                        ref={inputField.inputRef}
                        label={inputField.label}
                        value={inputField.value}
                        placeholder={inputField.placeholder}
                        onChange={inputField.onChange}
                        onConfirm={inputField.onConfirm}
                    />
                ) : null}

                {children}

                {hasFooter && (
                    <div className={`flex items-center gap-2 px-4 py-3 ${leadingAction ? "justify-between" : "justify-end"}`}>
                        {leadingAction ?? <div />}
                        {footerActions ? <div className="flex items-center gap-2">{footerActions}</div> : null}
                    </div>
                )}
            </div>
        </div>
    );
}
