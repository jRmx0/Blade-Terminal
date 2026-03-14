import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { flattenInternalCardModalListPartRows } from "./list-part/flattenRows";
import useInternalCardModalListPartActions from "./list-part/useInternalCardModalListPartActions";
import useInternalCardModalListPartColumnSizing from "./list-part/useInternalCardModalListPartColumnSizing";
import useInternalCardModalListPartSelectionDismiss from "./list-part/useInternalCardModalListPartSelectionDismiss";
import type {
    InternalCardModalListPartCell,
    InternalCardModalListPartColumn,
    InternalCardModalListPartRecordAction,
    InternalCardModalListPartRow,
    InternalCardModalListPartRowId,
    InternalCardModalListPartTableAction,
    InternalCardModalListPartTableActions,
} from "./list-part/types";

const SELECTION_COLUMN_WIDTH = 36;
const ACTIONS_COLUMN_WIDTH = 44;
const ROW_INDENT_STEP = 18;
const FALLBACK_MAIN_COLUMN: InternalCardModalListPartColumn = {
    id: "__main-column__",
    title: "",
    width: 180,
    editable: false,
};

export type {
    InternalCardModalListPartCell,
    InternalCardModalListPartColumn,
    InternalCardModalListPartRecordAction,
    InternalCardModalListPartRow,
    InternalCardModalListPartRowId,
    InternalCardModalListPartTableAction,
    InternalCardModalListPartTableActions,
} from "./list-part/types";

export interface InternalCardModalListPartProps {
    title?: ReactNode;
    badge?: ReactNode;
    columns?: InternalCardModalListPartColumn[];
    rows?: InternalCardModalListPartRow[];
    emptyMessage?: ReactNode;
    maxHeightClassName?: string;
    editable?: boolean;
    storageKey?: string;
    selectedRowIds?: InternalCardModalListPartRowId[];
    onSelectedRowIdsChange?: (nextSelectedRowIds: InternalCardModalListPartRowId[]) => void;
    tableActions?: InternalCardModalListPartTableActions;
    children?: ReactNode;
}

function toTitleCase(value: string) {
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getToneClassName(tone: InternalCardModalListPartCell["tone"] = "default") {
    switch (tone) {
        case "muted":
            return "text-gray-400";
        case "subtle":
            return "text-gray-300";
        default:
            return "text-gray-800";
    }
}

function getRecordActionsForRow(
    rows: InternalCardModalListPartRow[],
    targetRowId: InternalCardModalListPartRowId | null,
): InternalCardModalListPartRecordAction[] {
    if (targetRowId === null) {
        return [];
    }

    for (const row of rows) {
        if (row.id === targetRowId && row.kind === "record") {
            return row.actions ?? [];
        }

        if (row.kind === "group") {
            const nestedActions = getRecordActionsForRow(row.children, targetRowId);
            if (nestedActions.length > 0) {
                return nestedActions;
            }
        }
    }

    return [];
}

function InternalCardModalListPartTableActionButton({
    icon,
    label,
    onClick,
    disabled = false,
    variant = "default",
}: {
    icon: string;
    label: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    variant?: "default" | "danger";
}) {
    const colorClassName = variant === "danger"
        ? "border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
        : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400";

    return (
        <button
            type="button"
            onClick={() => { if (!disabled) void onClick(); }}
            disabled={disabled}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${colorClassName}`}
        >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
            {label}
        </button>
    );
}

export default function InternalCardModalListPart({
    title,
    badge,
    columns = [],
    rows,
    emptyMessage,
    maxHeightClassName,
    editable = false,
    storageKey,
    selectedRowIds = [],
    onSelectedRowIdsChange,
    tableActions,
    children,
}: InternalCardModalListPartProps) {
    const hasListContent = rows !== undefined;
    const hasHeader = title !== undefined || badge !== undefined;
    const hasRows = (rows?.length ?? 0) > 0;
    const mainColumn = columns[0] ?? FALLBACK_MAIN_COLUMN;
    const dataColumns = useMemo(
        () => columns.slice(1),
        [columns],
    );
    const selectedRowIdSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);
    const flattenedRows = useMemo(() => (
        rows ? flattenInternalCardModalListPartRows(rows) : []
    ), [rows]);
    const { columnWidths, resizingColumnId, handleResizeStart } = useInternalCardModalListPartColumnSizing({
        storageKey,
        columns,
    });
    const { openMenuRowId, menuPos, closeMenu, handleMoreClick } = useInternalCardModalListPartActions({
        onReplaceSelection: (rowId) => onSelectedRowIdsChange?.([rowId]),
    });
    const rootRef = useRef<HTMLDivElement>(null);
    const [editingCell, setEditingCell] = useState<{ rowId: InternalCardModalListPartRowId; columnId: string } | null>(null);

    useInternalCardModalListPartSelectionDismiss({
        enabled: selectedRowIds.length > 0,
        rootRef,
        onClearSelection: () => onSelectedRowIdsChange?.([]),
    });

    useEffect(() => {
        if (!editable) {
            setEditingCell(null);
        }
    }, [editable]);

    const recordActions = useMemo(
        () => getRecordActionsForRow(rows ?? [], openMenuRowId),
        [openMenuRowId, rows],
    );

    const gridTemplateColumns = useMemo(() => {
        const domainColumns = dataColumns.map((column) => `${columnWidths[column.id] ?? column.width ?? 180}px`);
        const mainColumnWidth = columnWidths[mainColumn.id] ?? mainColumn.width ?? 180;

        return [
            `${SELECTION_COLUMN_WIDTH}px`,
            `minmax(${mainColumnWidth}px, 1fr)`,
            `${ACTIONS_COLUMN_WIDTH}px`,
            ...domainColumns,
        ].join(" ");
    }, [columnWidths, dataColumns, mainColumn]);

    const totalGridWidth = useMemo(() => (
        SELECTION_COLUMN_WIDTH
        + (columnWidths[mainColumn.id] ?? mainColumn.width ?? 180)
        + ACTIONS_COLUMN_WIDTH
        + dataColumns.reduce((totalWidth, column) => totalWidth + (columnWidths[column.id] ?? column.width ?? 180), 0)
    ), [columnWidths, dataColumns, mainColumn]);

    const hasTableActions = Boolean(tableActions?.onNew) || Boolean(tableActions?.onDelete) || (tableActions?.actions?.length ?? 0) > 0;
    const scrollClassName = ["overflow-auto", maxHeightClassName].filter(Boolean).join(" ");

    function handleRowSelection(event: React.MouseEvent, rowId: InternalCardModalListPartRowId) {
        if (!onSelectedRowIdsChange) {
            return;
        }

        if (event.ctrlKey || event.metaKey) {
            if (selectedRowIdSet.has(rowId)) {
                onSelectedRowIdsChange(selectedRowIds.filter((selectedRowId) => selectedRowId !== rowId));
                return;
            }

            onSelectedRowIdsChange([...selectedRowIds, rowId]);
            return;
        }

        onSelectedRowIdsChange([rowId]);
    }

    async function handleBuiltInNew() {
        if (!tableActions?.onNew) {
            return;
        }

        const result = await tableActions.onNew();
        if (!result) {
            return;
        }

        onSelectedRowIdsChange?.([result.rowId]);

        const fallbackColumnId = columns.find((column) => column.editable !== false)?.id;
        const targetColumnId = result.columnId ?? fallbackColumnId;

        if (targetColumnId) {
            setEditingCell({ rowId: result.rowId, columnId: targetColumnId });
        }
    }

    async function handleBuiltInDelete() {
        if (!tableActions?.onDelete || selectedRowIds.length === 0) {
            return;
        }

        await tableActions.onDelete(selectedRowIds);
        onSelectedRowIdsChange?.([]);
    }

    return (
        <div ref={rootRef} className="flex shrink-0 flex-col gap-2 min-h-0">
            {hasHeader ? (
                <div className="flex items-center gap-2 px-1">
                    {title ? <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</span> : null}
                    {badge}
                </div>
            ) : null}
            {hasListContent ? (
                <div className={`border rounded overflow-hidden ${editable ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50"}`}>
                    {hasTableActions ? (
                        <div data-list-part-keep-selection="true" className={`flex items-center gap-2 flex-wrap px-3 py-2 border-b ${editable ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-gray-100"}`}>
                            {tableActions?.onNew ? (
                                <InternalCardModalListPartTableActionButton
                                    icon="add"
                                    label="New"
                                    onClick={handleBuiltInNew}
                                    disabled={tableActions.newDisabled || !editable}
                                />
                            ) : null}
                            {tableActions?.onDelete ? (
                                <InternalCardModalListPartTableActionButton
                                    icon="delete"
                                    label="Delete"
                                    variant="danger"
                                    onClick={handleBuiltInDelete}
                                    disabled={tableActions.deleteDisabled || !editable || selectedRowIds.length === 0}
                                />
                            ) : null}
                            {tableActions?.actions?.map((action: InternalCardModalListPartTableAction) => (
                                <InternalCardModalListPartTableActionButton
                                    key={action.id}
                                    icon={action.icon}
                                    label={action.label}
                                    variant={action.variant}
                                    disabled={action.disabled}
                                    onClick={() => action.onClick({ selectedRowIds })}
                                />
                            ))}
                        </div>
                    ) : null}
                    {!hasRows ? (
                        emptyMessage ? (
                            <p className="text-sm text-gray-400 italic text-center py-6 px-4">{emptyMessage}</p>
                        ) : null
                    ) : (
                        <div className={scrollClassName}>
                            <div className="min-w-0" style={{ width: `max(100%, ${totalGridWidth}px)` }}>
                                <div className="sticky top-0 z-10 overflow-hidden border-b border-gray-200 bg-gray-100">
                                    <div className="grid w-full items-stretch" style={{ gridTemplateColumns }}>
                                        <div className="px-2 py-2 border-r border-gray-200" />
                                        <div className="relative px-3 py-2 border-r border-gray-200">
                                            <div className="flex items-center justify-start min-w-0 text-[11px] font-semibold tracking-wide text-gray-500 text-left">
                                                <span className="truncate">{typeof mainColumn.title === "string" ? toTitleCase(mainColumn.title) : mainColumn.title}</span>
                                            </div>
                                            <button
                                                type="button"
                                                aria-label={`Resize ${typeof mainColumn.title === "string" ? mainColumn.title : mainColumn.id} column`}
                                                onMouseDown={(event) => handleResizeStart(event, mainColumn.id)}
                                                className={`absolute right-0 top-0 bottom-0 w-1 translate-x-1/2 cursor-col-resize transition-colors ${resizingColumnId === mainColumn.id ? "bg-teal-600" : "bg-transparent hover:bg-teal-500"}`}
                                            />
                                        </div>
                                        <div className="px-2 py-2 border-r border-gray-200" />
                                        {dataColumns.map((column) => (
                                            <div key={column.id} className="relative px-3 py-2 border-r last:border-r-0 border-gray-200">
                                                <div className="flex items-center justify-start min-w-0 text-[11px] font-semibold tracking-wide text-gray-500 text-left">
                                                    <span className="truncate">{typeof column.title === "string" ? toTitleCase(column.title) : column.title}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    aria-label={`Resize ${typeof column.title === "string" ? column.title : column.id} column`}
                                                    onMouseDown={(event) => handleResizeStart(event, column.id)}
                                                    className={`absolute right-0 top-0 bottom-0 w-1 translate-x-1/2 cursor-col-resize transition-colors ${resizingColumnId === column.id ? "bg-teal-600" : "bg-transparent hover:bg-teal-500"}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className={editable ? "divide-y divide-gray-100" : undefined}>
                                    {flattenedRows.map(({ row, depth }) => {
                                        if (row.kind === "group") {
                                            return (
                                                <div key={row.id} className="grid w-full items-stretch bg-gray-50" style={{ gridTemplateColumns }}>
                                                    <button
                                                        type="button"
                                                        onClick={row.onToggle}
                                                        className="flex items-center justify-center border-r border-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer"
                                                        title={row.expanded ? "Collapse group" : "Expand group"}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                                            {row.expanded ? "expand_more" : "chevron_right"}
                                                        </span>
                                                    </button>
                                                    <div className="flex min-w-0 items-center px-3 py-2 border-r border-gray-200 text-sm font-semibold text-gray-700">
                                                        <span className="truncate" style={{ paddingLeft: depth * ROW_INDENT_STEP }} title={typeof row.label === "string" ? row.label : undefined}>
                                                            {row.label}
                                                        </span>
                                                    </div>
                                                    <div className="border-r border-gray-200" />
                                                    {dataColumns.map((column) => (
                                                        <div key={`${row.id}-${column.id}`} className="border-r last:border-r-0 border-gray-200" />
                                                    ))}
                                                </div>
                                            );
                                        }

                                        const isSelected = selectedRowIdSet.has(row.id);
                                        const selectedIndicatorIcon = selectedRowIds.length > 1 ? "check_circle" : "arrow_forward";
                                        const hoverIndicatorIcon = selectedRowIds.length > 1 ? "circle" : "arrow_forward";
                                        const rowTextClassName = editable ? "text-gray-700" : "text-gray-500";
                                        const rowBackgroundClassName = editable
                                            ? "bg-white hover:bg-gray-50"
                                            : "bg-gray-50 hover:bg-gray-100";
                                        const mainColumnCell = row.cells[mainColumn.id];
                                        const isMainColumnEditing = editingCell?.rowId === row.id && editingCell.columnId === mainColumn.id;
                                        const isMainColumnEditable = editable
                                            && mainColumn.editable !== false
                                            && mainColumnCell?.editable !== false
                                            && Boolean(mainColumnCell?.editor)
                                            && !mainColumnCell?.editor?.disabled;
                                        const mainColumnDisplayValue = mainColumnCell?.value ?? mainColumnCell?.emptyValue ?? <span className="text-gray-300">—</span>;
                                        const mainColumnToneClassName = getToneClassName(mainColumnCell?.tone);
                                        const mainColumnMonoClassName = mainColumnCell?.mono ? "font-mono" : "";

                                        return (
                                            <div
                                                data-list-part-keep-selection="true"
                                                key={row.id}
                                                className={`group grid w-full items-stretch transition-colors ${rowBackgroundClassName}`}
                                                style={{ gridTemplateColumns }}
                                                onClick={(event) => {
                                                    if (row.selectable === false) {
                                                        return;
                                                    }

                                                    handleRowSelection(event, row.id);
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        if (row.selectable === false) {
                                                            return;
                                                        }

                                                        handleRowSelection(event, row.id);
                                                    }}
                                                    className={`flex items-center justify-center border-r border-gray-200 cursor-pointer ${isSelected ? "text-teal-600" : "text-gray-300"}`}
                                                    title={isSelected ? "Deselect row" : "Select row"}
                                                >
                                                    {isSelected ? (
                                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                                            {selectedIndicatorIcon}
                                                        </span>
                                                    ) : (
                                                        <span className="material-symbols-outlined opacity-0 transition-opacity group-hover:opacity-100" style={{ fontSize: 18 }}>
                                                            {hoverIndicatorIcon}
                                                        </span>
                                                    )}
                                                </button>
                                                <div
                                                    className={`flex min-w-0 items-center px-3 py-2 border-r border-gray-200 text-sm ${rowTextClassName}`}
                                                    onDoubleClick={(event) => {
                                                        event.stopPropagation();

                                                        if (isMainColumnEditable) {
                                                            setEditingCell({ rowId: row.id, columnId: mainColumn.id });
                                                        }
                                                    }}
                                                >
                                                    <div className="flex min-w-0 w-full items-center" style={{ paddingLeft: depth * ROW_INDENT_STEP }}>
                                                        {isMainColumnEditing && mainColumnCell?.editor ? (
                                                            <input
                                                                autoFocus
                                                                type={mainColumnCell.editor.type ?? "text"}
                                                                value={mainColumnCell.editor.value}
                                                                placeholder={mainColumnCell.editor.placeholder}
                                                                disabled={!editable || mainColumnCell.editor.disabled}
                                                                onChange={(event) => mainColumnCell.editor?.onChange(event.target.value)}
                                                                onBlur={() => {
                                                                    mainColumnCell.editor?.onConfirm?.();
                                                                    setEditingCell(null);
                                                                }}
                                                                onKeyDown={(event) => {
                                                                    if (event.key === "Enter") {
                                                                        mainColumnCell.editor?.onConfirm?.();
                                                                        setEditingCell(null);
                                                                    }

                                                                    if (event.key === "Escape") {
                                                                        mainColumnCell.editor?.onCancel?.();
                                                                        setEditingCell(null);
                                                                    }
                                                                }}
                                                                className="w-full px-2 py-1 text-sm border border-teal-600 rounded bg-white text-gray-800 focus:outline-none"
                                                            />
                                                        ) : (
                                                            <span
                                                                className={`truncate ${mainColumnToneClassName} ${mainColumnMonoClassName}`.trim()}
                                                                title={mainColumnCell?.title}
                                                            >
                                                                {mainColumnDisplayValue}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center border-r border-gray-200">
                                                    {row.actions && row.actions.length > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => handleMoreClick(event, row.id)}
                                                            className={`flex items-center justify-center w-7 h-7 rounded transition-opacity cursor-pointer ${isSelected ? "opacity-100 text-teal-600 hover:text-teal-700 hover:bg-gray-100" : openMenuRowId === row.id ? "opacity-100 text-gray-600 bg-gray-100" : "opacity-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 group-hover:opacity-100"}`}
                                                            title="Record actions"
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_vert</span>
                                                        </button>
                                                    ) : null}
                                                </div>
                                                {dataColumns.map((column) => {
                                                    const cell = row.cells[column.id];
                                                    const isEditing = editingCell?.rowId === row.id && editingCell.columnId === column.id;
                                                    const isCellEditable = editable
                                                        && column.editable !== false
                                                        && cell?.editable !== false
                                                        && Boolean(cell?.editor)
                                                        && !cell?.editor?.disabled;
                                                    const displayValue = cell?.value ?? cell?.emptyValue ?? <span className="text-gray-300">—</span>;
                                                    const toneClassName = getToneClassName(cell?.tone);
                                                    const monoClassName = cell?.mono ? "font-mono" : "";

                                                    return (
                                                        <div
                                                            key={`${row.id}-${column.id}`}
                                                            className={`flex min-w-0 items-center px-3 py-2 border-r last:border-r-0 border-gray-200 text-sm justify-start text-left ${rowTextClassName}`}
                                                            onDoubleClick={(event) => {
                                                                event.stopPropagation();

                                                                if (isCellEditable) {
                                                                    setEditingCell({ rowId: row.id, columnId: column.id });
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex min-w-0 w-full items-center">
                                                                {isEditing && cell?.editor ? (
                                                                    <input
                                                                        autoFocus
                                                                        type={cell.editor.type ?? "text"}
                                                                        value={cell.editor.value}
                                                                        placeholder={cell.editor.placeholder}
                                                                        disabled={!editable || cell.editor.disabled}
                                                                        onChange={(event) => cell.editor?.onChange(event.target.value)}
                                                                        onBlur={() => {
                                                                            cell.editor?.onConfirm?.();
                                                                            setEditingCell(null);
                                                                        }}
                                                                        onKeyDown={(event) => {
                                                                            if (event.key === "Enter") {
                                                                                cell.editor?.onConfirm?.();
                                                                                setEditingCell(null);
                                                                            }

                                                                            if (event.key === "Escape") {
                                                                                cell.editor?.onCancel?.();
                                                                                setEditingCell(null);
                                                                            }
                                                                        }}
                                                                        className="w-full px-2 py-1 text-sm border border-teal-600 rounded bg-white text-gray-800 focus:outline-none"
                                                                    />
                                                                ) : (
                                                                    <span className={`truncate ${toneClassName} ${monoClassName}`.trim()} title={cell?.title}>
                                                                        {displayValue}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    {openMenuRowId !== null && menuPos && recordActions.length > 0 && typeof document !== "undefined" ? createPortal(
                        <>
                            <div
                                className="fixed inset-0 z-55"
                                onMouseDown={(event) => { event.stopPropagation(); closeMenu(); }}
                            />
                            <div
                                data-list-part-keep-selection="true"
                                style={{ top: menuPos.top, left: menuPos.left }}
                                className="fixed z-58 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-36"
                                onMouseDown={(event) => event.stopPropagation()}
                            >
                                {recordActions.map((action) => (
                                    <button
                                        key={action.id}
                                        type="button"
                                        disabled={action.disabled}
                                        className={`flex items-center gap-2 w-full px-3 py-1 text-sm text-left cursor-pointer transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed ${action.variant === "danger" ? "text-red-600" : "text-gray-700"}`}
                                        onClick={() => {
                                            void action.onClick(openMenuRowId);
                                            closeMenu();
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{action.icon}</span>
                                        {action.title}
                                    </button>
                                ))}
                            </div>
                        </>,
                        document.body,
                    ) : null}
                </div>
            ) : children}
        </div>
    );
}
