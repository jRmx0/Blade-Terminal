import { useEffect, useState } from "react";
import { useWorkspacePickerStore } from "@/features/workspace-manager/stores/workspacePickerStore";
import { useEnvStore } from "@/stores/envStore";
import { getAllEnvironments, deleteEnvironment } from "@server/db/environments";
import type { Environment } from "@/types/envTypes";
import PickerModal from "@/components/picker-modal/PickerModal";
import PickerModalItem from "@/components/picker-modal/PickerModalItem";

export default function WorkspacePickerModal() {
    const isOpen = useWorkspacePickerStore((s) => s.isOpen);
    const close = useWorkspacePickerStore((s) => s.close);
    const load = useEnvStore((s) => s.load);

    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);
        getAllEnvironments()
            .then(setEnvironments)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    async function handleOpen(env: Environment) {
        await load(env.id);
        close();
    }

    async function handleDelete(id: string) {
        await deleteEnvironment(id);
        setEnvironments((prev) => prev.filter((env) => env.id !== id));
    }

    return (
        <PickerModal
            isOpen={isOpen}
            title="Open environment"
            onClose={close}
            isLoading={isLoading}
            isEmpty={environments.length === 0}
            emptyMessage="No saved workspaces"
        >
            {environments.map((env) => (
                <PickerModalItem
                    key={env.id}
                    label={env.name}
                    subLabel={env.id}
                    onOpen={() => handleOpen(env)}
                    onDelete={() => handleDelete(env.id)}
                />
            ))}
        </PickerModal>
    );
}
