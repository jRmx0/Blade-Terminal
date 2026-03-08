import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@server/db/db";
import type { ComputationProvider } from "@/types/serviceTypes";
import { useComputationProvidersListModalStore } from "@/features/computation-provider/stores/computationProvidersListModalStore";
import { useComputationProviderCardStore } from "@/features/computation-provider/stores/computationProviderCardStore";
import { deleteComputationProvider } from "@server/db/computationProviders";
import { useDeleteModalStore } from "@/features/workspace-manager/stores/deleteModalStore";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";
import ModalHeader from "@/components/modal/ModalHeader";
import ModalFooterButton from "@/components/modal/ModalFooterButton";
import ModalListPart from "@/components/modal/ModalListPart";

export default function ComputationProvidersListModal() {
    const { isOpen, close } = useComputationProvidersListModalStore();
    const openCard = useComputationProviderCardStore((s) => s.open);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const providers = useLiveQuery<ComputationProvider[]>(
        () => db.table("computationProviders").toArray(),
        [],
    );

    useShortcutsBlocked("computation-provider-list-modal", isOpen);

    useEffect(() => {
        if (!isOpen) setSelectedId(null);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") close();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, close]);

    if (!isOpen) return null;

    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    function handleView(id: number) {
        close();
        openCard(id);
    }

    function handleAdd() {
        close();
        openCard(null);
    }

    function handleDelete(id: number) {
        const provider = providers?.find((p) => p.id === id);
        if (!provider) return;
        useDeleteModalStore.getState().requestDelete(provider.name, async () => {
            await deleteComputationProvider(id);
        });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropClick}
        >
            <div
                className="flex flex-col w-130 bg-gray-100 rounded-lg shadow-xl overflow-hidden"
                onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest("button") && !target.closest("input")) setSelectedId(null);
                }}
            >
                <ModalHeader title="Computation Providers" onClose={close} />

                <div className="flex flex-col mx-4">
                    <ModalListPart
                        items={providers?.filter((p): p is ComputationProvider & { id: number } => p.id !== undefined) ?? []}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onDoubleClick={handleView}
                        actions={[{ icon: "delete", title: "Delete", variant: "danger", onClick: handleDelete }]}
                        emptyMessage="No providers yet. Add one to get started."
                    />
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-teal-700 hover:bg-teal-50 rounded cursor-pointer transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                        Add Provider
                    </button>
                    <ModalFooterButton onClick={close}>Close</ModalFooterButton>
                </div>
            </div>
        </div>
    );
}
