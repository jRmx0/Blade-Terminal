import type { Environment } from "@/types/schemaTypes";

interface ModalWorkspaceSelectListProps {
    environments: Environment[];
    selectedEnvId: number | null;
    onSelect: (id: number) => void;
    /** Id of the currently active/loaded workspace — its name is rendered bold. */
    activeEnvId?: number | null;
    /** When provided, a delete icon appears on hover for each row. */
    onDelete?: (id: number) => void;
    /** Fires when a row is double-clicked. */
    onDoubleClick?: (id: number) => void;
    /** Fires when the list background is clicked (not a row) — use to deselect. */
    onDeselect?: () => void;
    emptyMessage?: string;
}

export default function ModalWorkspaceSelectList({
    environments,
    selectedEnvId,
    onSelect,
    activeEnvId,
    onDelete,
    onDoubleClick,
    onDeselect,
    emptyMessage = "No saved workspaces",
}: ModalWorkspaceSelectListProps) {
    return (
        <ul className="border border-gray-300 bg-white h-52 overflow-y-auto rounded">
            {/* Sticky column header */}
            <li className={`sticky top-0 flex items-center px-3 py-1 bg-gray-200 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-300 z-10 cursor-default ${onDelete ? "pr-10" : ""}`}>
                <span className="flex-1">Name</span>
                <span className="w-10 text-right">ID</span>
            </li>

            {environments.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-400 italic">{emptyMessage}</li>
            ) : (
                environments.map((env) => {
                    const isSelected = env.id === selectedEnvId;
                    const isActive = env.id === activeEnvId;
                    return (
                        <li key={env.id} className="group relative">
                            <button
                                type="button"
                                className={`flex items-center w-full px-3 py-1.5 text-sm text-left cursor-pointer transition-colors ${onDelete ? "pr-10" : ""
                                    } ${isSelected
                                        ? "bg-blue-500 text-white"
                                        : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                onClick={(e) => { e.stopPropagation(); onSelect(env.id); }}
                                onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(env.id); }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <span className={`flex-1 truncate ${isActive && !isSelected ? "font-bold" : ""
                                    }`}>
                                    {env.name}
                                </span>
                                <span className={`w-10 text-right shrink-0 tabular-nums ${isSelected ? "text-white" : "text-gray-400"
                                    }`}>
                                    {env.id}
                                </span>
                            </button>
                            {onDelete && (
                                <button
                                    type="button"
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity leading-none cursor-pointer ${isSelected
                                        ? "text-blue-200 hover:text-white hover:bg-blue-600"
                                        : "text-gray-400 hover:text-red-500 hover:bg-gray-200"
                                        }`}
                                    onClick={(e) => { e.stopPropagation(); onDelete(env.id); }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    title="Delete"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                                </button>
                            )}
                        </li>
                    );
                })
            )}
        </ul>
    );
}
