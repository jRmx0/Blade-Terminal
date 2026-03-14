import type { ReactNode } from "react";

export interface InternalCardModalListPartColumn {
    id: string;
    title: ReactNode;
}

export interface InternalCardModalListPartRow {
    id: string;
    cells: InternalCardModalListPartCell[];
}

export interface InternalCardModalListPartCell {
    value: ReactNode;
    secondaryValue?: ReactNode;
    tone?: "default" | "muted" | "subtle";
    mono?: boolean;
    secondaryTone?: "default" | "muted" | "subtle";
    secondaryMono?: boolean;
}

export interface InternalCardModalListPartItem {
    id: string | number;
    title: ReactNode;
    subtitle?: ReactNode;
    expanded: boolean;
    onToggle: () => void;
    emptyMessage?: ReactNode;
    columns?: InternalCardModalListPartColumn[];
    rows?: InternalCardModalListPartRow[];
}

interface InternalCardModalListPartProps {
    title: string;
    badge?: ReactNode;
    items?: InternalCardModalListPartItem[];
    emptyMessage?: ReactNode;
    children?: ReactNode;
}

export default function InternalCardModalListPart({
    title,
    badge,
    items,
    emptyMessage,
    children,
}: InternalCardModalListPartProps) {
    const hasListContent = items !== undefined;

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

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
                {badge}
            </div>
            {hasListContent ? (
                items.length === 0 ? (
                    emptyMessage ? (
                        <p className="text-sm text-gray-400 italic text-center py-6">{emptyMessage}</p>
                    ) : null
                ) : (
                    <div className="border border-gray-200 rounded bg-white overflow-hidden">
                        {items.map((item) => {
                            const columns = item.columns ?? [];

                            return (
                                <div key={item.id} className="border-b border-gray-100 last:border-b-0">
                                    <button
                                        type="button"
                                        onClick={item.onToggle}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-gray-400 shrink-0" style={{ fontSize: 16 }}>
                                            {item.expanded ? "expand_more" : "chevron_right"}
                                        </span>
                                        <span className="text-sm font-medium text-gray-800">{item.title}</span>
                                        {item.subtitle ? (
                                            <span className="text-xs text-gray-400 font-mono ml-1">{item.subtitle}</span>
                                        ) : null}
                                    </button>
                                    {item.expanded ? (
                                        <div className="ml-7 mr-3 pb-3">
                                            {!item.rows || item.rows.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic px-1 py-1">{item.emptyMessage ?? "No items"}</p>
                                            ) : (
                                                <table className="w-full text-xs">
                                                    {columns.length > 0 ? (
                                                        <thead>
                                                            <tr className="text-gray-400 uppercase tracking-wide">
                                                                {columns.map((column, index) => (
                                                                    <th
                                                                        key={column.id}
                                                                        className={`text-left font-medium pb-1 ${index < columns.length - 1 ? "pr-4" : ""}`}
                                                                    >
                                                                        {column.title}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                    ) : null}
                                                    <tbody>
                                                        {item.rows.map((row) => (
                                                            <tr key={row.id} className="border-t border-gray-100">
                                                                {row.cells.map((cell, index) => (
                                                                    <td
                                                                        key={`${row.id}-${index}`}
                                                                        className={`py-1 ${index < row.cells.length - 1 ? "pr-4" : ""} text-gray-600`}
                                                                    >
                                                                        <span className={`${getToneClassName(cell.tone)} ${cell.mono ? "font-mono" : ""}`.trim()}>
                                                                            {cell.value}
                                                                        </span>
                                                                        {cell.secondaryValue ? (
                                                                            <span
                                                                                className={`ml-1.5 ${getToneClassName(cell.secondaryTone ?? "muted")} ${cell.secondaryMono ? "font-mono" : ""}`.trim()}
                                                                            >
                                                                                {cell.secondaryValue}
                                                                            </span>
                                                                        ) : null}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )
            ) : children}
        </div>
    );
}