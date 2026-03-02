import type { Environment } from "@/types/envTypes";

interface ModalWorkspaceSelectListProps {
    environments: Environment[];
    selectedEnvId: number | null;
    onSelect: (id: number) => void;
}

export default function ModalWorkspaceSelectList({ environments, selectedEnvId, onSelect }: ModalWorkspaceSelectListProps) {
    return (
        <ul className="border border-gray-300 bg-white h-52 overflow-y-auto rounded">
            {/* Sticky column header */}
            <li className="sticky top-0 flex items-center px-3 py-1 bg-gray-200 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-300 z-10">
                <span className="flex-1">Name</span>
                <span className="w-10 text-right">ID</span>
            </li>

            {environments.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-400 italic">No saved workspaces</li>
            ) : (
                environments.map((env) => {
                    const isSelected = env.id === selectedEnvId;
                    return (
                        <li key={env.id}>
                            <button
                                type="button"
                                className={`flex items-center w-full px-3 py-1.5 text-sm text-left cursor-pointer transition-colors ${isSelected
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                onClick={() => onSelect(env.id)}
                            >
                                <span className="flex-1 truncate">{env.name}</span>
                                <span className={`w-10 text-right shrink-0 tabular-nums ${isSelected ? "text-white" : "text-gray-400"
                                    }`}>
                                    {env.id}
                                </span>
                            </button>
                        </li>
                    );
                })
            )}
        </ul>
    );
}
