import { useEffect, useState } from "react";
import { useWorkspacePickerStore } from "@/features/workspace-manager/stores/workspacePickerStore";
import { useEnvStore } from "@/stores/envStore";
import { useSaveModalStore } from "@/features/workspace-manager/stores/saveModalStore";
import { useDeleteModalStore } from "@/features/workspace-manager/stores/deleteModalStore";
import { getAllEnvironments, deleteEnvironmentCascade } from "@server/db/environments";
import type { Environment } from "@/types/envTypes";
import PickerModal from "@/components/picker-modal/PickerModal";
import PickerModalItem from "@/components/picker-modal/PickerModalItem";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";

export default function WorkspacePickerModal() {
    const isOpen = useWorkspacePickerStore((s) => s.isOpen);
    const close = useWorkspacePickerStore((s) => s.close);
    const load = useEnvStore((s) => s.load);
    const currentEnvId = useEnvStore((s) => s.env.id);

    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useShortcutsBlocked("workspace-picker-modal", isOpen);

    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);
        getAllEnvironments()
            .then(setEnvironments)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    function handleOpen(env: Environment) {
        useSaveModalStore.getState().requestWithSaveGuard(async () => {
            await load(env.id);
            close();
        });
    }

    function handleDelete(env: Environment) {
        useDeleteModalStore.getState().requestDelete(env.name, async () => {
            await deleteEnvironmentCascade(env.id);
            setEnvironments((prev) => prev.filter((e) => e.id !== env.id));

            if (env.id === currentEnvId) {
                await useEnvStore.getState().reset();
            }
        });
    }

    return (
        <PickerModal
            isOpen={isOpen}
            title="Open environment"
            onClose={close}
            isLoading={isLoading}
            isEmpty={environments.length === 0}
            emptyMessage="No saved workspaces"
            onCancel={close}
        >
            {environments.map((env) => (
                <PickerModalItem
                    key={env.id}
                    label={env.name}
                    subLabel={String(env.id)}
                    isActive={env.id === currentEnvId}
                    onOpen={() => handleOpen(env)}
                    onDelete={() => handleDelete(env)}
                />
            ))}
        </PickerModal>
    );
}
