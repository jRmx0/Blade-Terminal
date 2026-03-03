import { useEffect, useState } from "react";
import { useWorkspacePickerStore } from "@/features/workspace-manager/stores/workspacePickerStore";
import { useSaveModalStore } from "@/features/workspace-manager/stores/saveModalStore";
import { useDeleteModalStore } from "@/features/workspace-manager/stores/deleteModalStore";
import { getAllEnvironments, deleteEnvironmentCascade } from "@server/db/environments";
import { loadWorkspace, resetWorkspace } from "@/features/workspace-manager/data/workspaceBridge";
import { useEnvStore } from "@/stores/envStore";
import type { Environment } from "@/types/envTypes";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";
import ModalHeader from "@/components/modal/ModalHeader";
import ModalFooterButton from "@/components/modal/ModalFooterButton";
import ModalWorkspaceSelectList from "@/components/modal/ModalWorkspaceSelectList";

export default function WorkspacePickerModal() {
    const isOpen = useWorkspacePickerStore((s) => s.isOpen);
    const close = useWorkspacePickerStore((s) => s.close);
    const currentEnvId = useEnvStore((s) => s.env.id);

    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);

    useShortcutsBlocked("workspace-picker-modal", isOpen);

    useEffect(() => {
        if (!isOpen) {
            setSelectedEnvId(null);
            return;
        }
        setIsLoading(true);
        getAllEnvironments()
            .then(setEnvironments)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") close();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, close]);

    function handleOpenById(id: number) {
        const env = environments.find((e) => e.id === id);
        if (!env || env.id === currentEnvId) return;
        useSaveModalStore.getState().requestWithSaveGuard(async () => {
            await loadWorkspace(env.id);
            close();
        });
    }

    function handleDelete(id: number) {
        const env = environments.find((e) => e.id === id);
        if (!env) return;
        useDeleteModalStore.getState().requestDelete(env.name, async () => {
            await deleteEnvironmentCascade(env.id);
            setEnvironments((prev) => prev.filter((e) => e.id !== env.id));
            setSelectedEnvId((prev) => (prev === env.id ? null : prev));
            if (env.id === currentEnvId) {
                await resetWorkspace();
            }
        });
    }

    if (!isOpen) return null;

    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    const canOpen = selectedEnvId !== null && selectedEnvId !== currentEnvId;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropClick}
        >
            <div
                className="flex flex-col w-130 bg-gray-100 rounded-lg shadow-xl overflow-hidden"
                onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest("button") && !target.closest("input")) {
                        setSelectedEnvId(null);
                    }
                }}
            >
                <ModalHeader title="Open Workspace" onClose={close} />

                <div className="flex flex-col mx-4 mt-4">
                    {isLoading ? (
                        <div className="border border-gray-300 bg-white h-52 rounded flex items-center justify-center text-sm text-gray-400 italic">
                            Loading...
                        </div>
                    ) : (
                        <ModalWorkspaceSelectList
                            environments={environments}
                            selectedEnvId={selectedEnvId}
                            activeEnvId={currentEnvId}
                            onSelect={setSelectedEnvId}
                            onDeselect={() => setSelectedEnvId(null)}
                            onDoubleClick={handleOpenById}
                            onDelete={handleDelete}
                            emptyMessage="No saved workspaces"
                        />
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 px-4 py-3">
                    <ModalFooterButton onClick={close}>Cancel</ModalFooterButton>
                    <ModalFooterButton
                        variant="primary"
                        onClick={() => selectedEnvId !== null && handleOpenById(selectedEnvId)}
                        disabled={!canOpen}
                    >
                        Open
                    </ModalFooterButton>
                </div>
            </div>
        </div>
    );
}
