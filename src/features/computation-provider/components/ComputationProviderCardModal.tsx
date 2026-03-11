import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@server/db/db";
import type { ComputationProvider, ComputationAlgorithm, AlgorithmParameter, ComputationAlgorithmDetails, FetchedComputationMetadata } from "@/types/serviceTypes";
import { useComputationProviderCardStore } from "@/features/computation-provider/stores/computationProviderCardStore";
import { useComputationProvidersListModalStore } from "@/features/computation-provider/stores/computationProvidersListModalStore";
import { saveComputationProvider, deleteComputationProvider } from "@server/db/computationProviders";
import { testConnection, fetchMetadataPreview, persistFetchedMetadata } from "@/features/computation-provider/data/computationProviderService";
import { useComputationProviderAutosave } from "@/features/computation-provider/hooks/useComputationProviderAutosave";
import { useDeleteModalStore } from "@/features/workspace-manager/stores/deleteModalStore";
import { useConfirmationModalStore } from "@/stores/confirmationModalStore";
import CardModal, {
    type CardModalFastTabConfig,
    type CardModalHeaderConfig,
    type CardModalSavedState,
    type CardModalSectionConfig,
} from "@/components/modals/card-modal/CardModal";
import type { ModalActionStatus } from "@/components/modal/modal-action-bar/ModalActionBarAction";

type ComputationProviderForm = Omit<ComputationProvider, "id">;

const EMPTY_FORM: ComputationProviderForm = {
    name: "",
    url: "",
    apiKey: "",
    metadataFetchedAt: null,
    urlAtLastFetch: null,
};

type ActionFeedback = {
    status?: ModalActionStatus;
    message?: string;
};

const EMPTY_ACTION_FEEDBACK: ActionFeedback = {};
const MIN_ACTION_LOADING_MS = 500;

function normalizeForm(form: ComputationProviderForm): ComputationProviderForm {
    return {
        ...form,
        name: form.name.trim(),
        url: form.url.trim(),
    };
}

function toFormState(provider: ComputationProviderForm | ComputationProvider): ComputationProviderForm {
    return normalizeForm({
        name: provider.name,
        url: provider.url,
        apiKey: provider.apiKey,
        metadataFetchedAt: provider.metadataFetchedAt,
        urlAtLastFetch: provider.urlAtLastFetch,
    });
}

function areFormsEqual(a: ComputationProviderForm, b: ComputationProviderForm) {
    return a.name === b.name
        && a.url === b.url
        && a.apiKey === b.apiKey
        && a.metadataFetchedAt === b.metadataFetchedAt
        && a.urlAtLastFetch === b.urlAtLastFetch;
}

function areAlgorithmDetailsEqual(a: ComputationAlgorithmDetails[], b: ComputationAlgorithmDetails[]) {
    if (a.length !== b.length) return false;

    return a.every((left, index) => {
        const right = b[index];
        if (!right) return false;

        const sameAlgorithm = left.algorithm.id === right.algorithm.id
            && left.algorithm.name === right.algorithm.name
            && left.algorithm.label === right.algorithm.label;

        if (!sameAlgorithm || left.parameters.length !== right.parameters.length) {
            return false;
        }

        return left.parameters.every((leftParam, paramIndex) => {
            const rightParam = right.parameters[paramIndex];
            if (!rightParam) return false;

            return leftParam.id === rightParam.id
                && leftParam.algorithmId === rightParam.algorithmId
                && leftParam.name === rightParam.name
                && leftParam.label === rightParam.label
                && leftParam.paramType === rightParam.paramType
                && leftParam.defaultValue === rightParam.defaultValue
                && leftParam.enumValues.length === rightParam.enumValues.length
                && leftParam.enumValues.every((value, enumIndex) => value === rightParam.enumValues[enumIndex]);
        });
    });
}

function areFetchedMetadataEqual(
    a: FetchedComputationMetadata | null,
    b: FetchedComputationMetadata | null,
) {
    if (a === b) return true;
    if (!a || !b) return false;

    return a.metadataFetchedAt === b.metadataFetchedAt
        && a.urlAtLastFetch === b.urlAtLastFetch
        && areAlgorithmDetailsEqual(a.algorithms, b.algorithms);
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

async function withMinimumLoadingTime<T>(operation: () => Promise<T>, minDurationMs = MIN_ACTION_LOADING_MS) {
    const startedAt = performance.now();

    try {
        return await operation();
    } finally {
        const elapsedMs = performance.now() - startedAt;
        const remainingMs = minDurationMs - elapsedMs;

        if (remainingMs > 0) {
            await sleep(remainingMs);
        }
    }
}

// ─── AlgorithmRow ─────────────────────────────────────────────────────────────

function AlgorithmRow({ algo, parameters, expanded, onToggle }: {
    algo: ComputationAlgorithm;
    parameters?: AlgorithmParameter[];
    expanded: boolean;
    onToggle: () => void;
}) {
    const liveParameters = useLiveQuery<AlgorithmParameter[]>(
        () =>
            parameters !== undefined
                ? Promise.resolve(parameters)
                : db
                    .table("computationAlgorithmParameters")
                    .where("[algorithmId+computationProviderId]")
                    .equals([algo.id, algo.computationProviderId])
                    .toArray(),
        [algo.id, algo.computationProviderId, parameters],
    );
    const resolvedParameters = parameters ?? liveParameters;

    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
                <span className="material-symbols-outlined text-gray-400 shrink-0" style={{ fontSize: 16 }}>
                    {expanded ? "expand_more" : "chevron_right"}
                </span>
                <span className="text-sm font-medium text-gray-800">{algo.label}</span>
                <span className="text-xs text-gray-400 font-mono ml-1">{algo.name}</span>
            </button>
            {expanded && (
                <div className="ml-7 mr-3 pb-3">
                    {!resolvedParameters || resolvedParameters.length === 0 ? (
                        <p className="text-xs text-gray-400 italic px-1 py-1">No parameters</p>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-gray-400 uppercase tracking-wide">
                                    <th className="text-left font-medium pb-1 pr-4">Parameter</th>
                                    <th className="text-left font-medium pb-1 pr-4">Type</th>
                                    <th className="text-left font-medium pb-1">Values / Default</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resolvedParameters.map((p) => (
                                    <tr key={p.name} className="border-t border-gray-100">
                                        <td className="py-1 pr-4">
                                            <span className="text-gray-800">{p.label}</span>
                                            <span className="ml-1.5 text-gray-400 font-mono">{p.name}</span>
                                        </td>
                                        <td className="py-1 pr-4 font-mono text-gray-600">{p.paramType}</td>
                                        <td className="py-1 text-gray-600">
                                            {p.enumValues.length > 0 ? (
                                                <span>{p.enumValues.join(", ")}</span>
                                            ) : p.defaultValue ? (
                                                <span className="text-gray-400">default: {p.defaultValue}</span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── ComputationProviderCard ──────────────────────────────────────────────────

export default function ComputationProviderCard() {
    const {
        isOpen,
        selectedProviderId,
        close,
        setSelectedProviderId,
    } = useComputationProviderCardStore();
    const openList = useComputationProvidersListModalStore((s) => s.open);
    const isConfirmationModalOpen = useConfirmationModalStore((s) => s.isOpen);

    const [form, setForm] = useState<ComputationProviderForm>(EMPTY_FORM);
    const [savedForm, setSavedForm] = useState<ComputationProviderForm>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [fastTabOpen, setFastTabOpen] = useState<Record<string, boolean>>({ general: true });
    const [algoExpanded, setAlgoExpanded] = useState<Record<number, boolean>>({});
    const [draftMetadata, setDraftMetadata] = useState<FetchedComputationMetadata | null>(null);
    const [testActionFeedback, setTestActionFeedback] = useState<ActionFeedback>(EMPTY_ACTION_FEEDBACK);
    const [fetchActionFeedback, setFetchActionFeedback] = useState<ActionFeedback>(EMPTY_ACTION_FEEDBACK);
    const [isSaving, setIsSaving] = useState(false);
    const savePromiseRef = useRef<Promise<boolean> | null>(null);
    const isDirtyRef = useRef(false);
    const canSaveRef = useRef(false);
    const skipNextProviderLoadRef = useRef<number | null>(null);

    const algorithms = useLiveQuery<ComputationAlgorithm[]>(
        () =>
            editingId !== null
                ? db.table("computationAlgorithms").where("computationProviderId").equals(editingId).toArray()
                : Promise.resolve([]),
        [editingId],
    );

    const isStale = form.urlAtLastFetch !== null && form.url.trim() !== form.urlAtLastFetch;
    const lastFetchLabel =
        form.metadataFetchedAt === null
            ? "Never fetched"
            : `Last fetched: ${new Date(form.metadataFetchedAt).toLocaleString()}`;
    const normalizedForm = normalizeForm(form);
    const canSave = Boolean(normalizedForm.name && normalizedForm.url);
    const canTestConnection = Boolean(normalizedForm.url);
    const canFetchMetadata = Boolean(normalizedForm.url);
    const hasDraftAlgorithms = draftMetadata !== null;
    const isDirty = !areFormsEqual(normalizedForm, savedForm) || hasDraftAlgorithms;
    const savedState: CardModalSavedState = isDirty ? "unsaved" : editingId === null ? "nothing_to_save" : "saved";
    const isSavedProvider = editingId !== null;
    const visibleAlgorithms = draftMetadata?.algorithms ?? null;

    useEffect(() => {
        if (!isOpen) {
            setEditingId(null);
            setForm(EMPTY_FORM);
            setSavedForm(EMPTY_FORM);
            setAlgoExpanded({});
            setDraftMetadata(null);
            setIsEditMode(false);
            setTestActionFeedback(EMPTY_ACTION_FEEDBACK);
            setFetchActionFeedback(EMPTY_ACTION_FEEDBACK);
            setIsSaving(false);
            savePromiseRef.current = null;
            return;
        }
        setEditingId(selectedProviderId);
        setTestActionFeedback(EMPTY_ACTION_FEEDBACK);
        setFetchActionFeedback(EMPTY_ACTION_FEEDBACK);
        if (selectedProviderId === null) {
            setForm(EMPTY_FORM);
            setSavedForm(EMPTY_FORM);
            setDraftMetadata(null);
            return;
        }
        if (skipNextProviderLoadRef.current === selectedProviderId) {
            skipNextProviderLoadRef.current = null;
            return;
        }
        (db.table("computationProviders").get(selectedProviderId) as Promise<ComputationProvider | undefined>).then(
            (p) => {
                if (p) {
                    const nextForm = toFormState(p);
                    setForm(nextForm);
                    setSavedForm(nextForm);
                    setDraftMetadata(null);
                }
            },
        );
    }, [isOpen, selectedProviderId]);

    useEffect(() => {
        isDirtyRef.current = isDirty;
        canSaveRef.current = canSave;
    }, [canSave, isDirty]);

    const saveProviderChanges = useCallback(async () => {
        if (savePromiseRef.current) {
            return savePromiseRef.current;
        }

        const formSnapshot = normalizeForm(form);
        if (!formSnapshot.name || !formSnapshot.url) {
            return false;
        }

        const draftMetadataSnapshot = draftMetadata;
        const savePromise = (async () => {
            setIsSaving(true);

            try {
                const record: ComputationProvider = editingId !== null
                    ? { ...formSnapshot, id: editingId }
                    : formSnapshot;
                const savedId = await saveComputationProvider(record);

                if (draftMetadataSnapshot !== null) {
                    await persistFetchedMetadata(savedId, draftMetadataSnapshot);
                }

                setEditingId(savedId);
                skipNextProviderLoadRef.current = savedId;
                setSelectedProviderId(savedId);
                setSavedForm(formSnapshot);
                setForm((currentForm) => {
                    const normalizedCurrentForm = normalizeForm(currentForm);

                    return areFormsEqual(normalizedCurrentForm, formSnapshot)
                        ? formSnapshot
                        : currentForm;
                });
                setDraftMetadata((currentDraftMetadata) => (
                    areFetchedMetadataEqual(currentDraftMetadata, draftMetadataSnapshot)
                        ? null
                        : currentDraftMetadata
                ));

                return true;
            } finally {
                setIsSaving(false);
                savePromiseRef.current = null;
            }
        })();

        savePromiseRef.current = savePromise;
        return savePromise;
    }, [draftMetadata, editingId, form, setSelectedProviderId]);

    const isAutoSavePending = useComputationProviderAutosave({
        isOpen,
        isEditMode,
        isDirty,
        canSave,
        editingId,
        isSaving,
        onAutosave: saveProviderChanges,
    });
    const headerSavedState: CardModalSavedState = isAutoSavePending ? "saving" : savedState;

    async function completeClose() {
        close();
        openList();
    }

    async function requestClose() {
        if (savePromiseRef.current !== null) {
            await savePromiseRef.current;
            await sleep(0);
        }

        if (!isDirtyRef.current) {
            await completeClose();
            return;
        }

        useConfirmationModalStore.getState().requestConfirmation({
            title: "Unsaved Changes",
            message: "Your changes will be lost if you don't save them.",
            tone: "warning",
            confirmLabel: "Save",
            secondaryLabel: "Don't Save",
            cancelLabel: "Cancel",
            confirmDisabled: !canSaveRef.current,
            confirmAction: async () => {
                await saveProviderChanges();
                await completeClose();
            },
            secondaryAction: completeClose,
        });
    }

    function handleClose() {
        requestClose().catch(console.error);
    }

    function toggleFastTab(key: string) {
        setFastTabOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function toggleAlgo(id: number) {
        setAlgoExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    async function handleSave() {
        await saveProviderChanges();
    }

    function handleDelete() {
        if (editingId === null) return;
        useDeleteModalStore.getState().requestDelete(form.name || "this provider", async () => {
            await deleteComputationProvider(editingId);
            close();
            openList();
        });
    }

    async function handleTestConnection() {
        const provider: ComputationProvider = editingId !== null
            ? { ...normalizedForm, id: editingId }
            : normalizedForm;
        if (!provider.url) return;
        setTestActionFeedback({ status: "loading", message: "Testing connection…" });
        const result = await withMinimumLoadingTime(() => testConnection(provider));
        setTestActionFeedback(
            result.ok
                ? { status: "success", message: "Connection successful." }
                : { status: "error", message: result.error },
        );
    }

    async function handleFetchMetadata() {
        const provider: ComputationProvider = editingId !== null
            ? { ...normalizedForm, id: editingId }
            : normalizedForm;
        if (!provider.url) return;

        setFetchActionFeedback({ status: "loading", message: "Fetching metadata…" });
        const result = await withMinimumLoadingTime(() => fetchMetadataPreview(provider));
        if (result.ok) {
            const shouldPersistImmediately = editingId !== null && !isDirty;

            setForm((currentForm) => ({
                ...currentForm,
                urlAtLastFetch: result.metadata.urlAtLastFetch,
                metadataFetchedAt: result.metadata.metadataFetchedAt,
            }));

            if (shouldPersistImmediately && editingId !== null) {
                await persistFetchedMetadata(editingId, result.metadata);
                setSavedForm((currentSavedForm) => ({
                    ...currentSavedForm,
                    urlAtLastFetch: result.metadata.urlAtLastFetch,
                    metadataFetchedAt: result.metadata.metadataFetchedAt,
                }));
                setDraftMetadata(null);
            } else {
                setDraftMetadata(result.metadata);
            }

            setFetchActionFeedback({
                status: "success",
                message: shouldPersistImmediately
                    ? `Loaded ${result.algorithmCount} algorithm(s).`
                    : `Loaded ${result.algorithmCount} algorithm(s). Save provider to keep them.`,
            });
            return;
        }
        setFetchActionFeedback({ status: "error", message: result.error });
    }

    const headerConfig: CardModalHeaderConfig = {
        recordId: editingId,
        recordName: form.name.trim(),
        savedState: headerSavedState,
        onSave: handleSave,
        canSave,
        isEditMode,
        onEdit: () => setIsEditMode((v) => !v),
        onNew: () => {
            setEditingId(null);
            setForm(EMPTY_FORM);
            setSavedForm(EMPTY_FORM);
            setDraftMetadata(null);
            setIsEditMode(true);
            setTestActionFeedback(EMPTY_ACTION_FEEDBACK);
            setFetchActionFeedback(EMPTY_ACTION_FEEDBACK);
        },
        onDelete: handleDelete,
        canDelete: editingId !== null,
    };

    const fastTabs: CardModalFastTabConfig[] = [
        {
            id: "general",
            title: "General",
            expanded: !!fastTabOpen.general,
            onToggle: () => toggleFastTab("general"),
            disabled: !isEditMode,
            fields: [
                {
                    id: "name",
                    label: "Name",
                    value: form.name,
                    required: true,
                    disabled: !isEditMode,
                    onChange: (v) => setForm((f) => ({ ...f, name: v })),
                },
                {
                    id: "service-url",
                    label: "Service URL",
                    value: form.url,
                    required: true,
                    disabled: !isEditMode,
                    onChange: (v) => setForm((f) => ({ ...f, url: v })),
                    hint: isStale
                        ? "Metadata may be stale — URL changed since last fetch"
                        : lastFetchLabel,
                    hintState: isStale ? "warning" : "info",
                },
                {
                    id: "api-key",
                    label: "API Key",
                    value: form.apiKey,
                    type: "password",
                    disabled: !isEditMode,
                    onChange: (v) => setForm((f) => ({ ...f, apiKey: v })),
                },
            ],
        },
    ];

    const sections: CardModalSectionConfig[] = [
        {
            id: "algorithms",
            title: "Algorithms",
            badge: hasDraftAlgorithms ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Unsaved
                </span>
            ) : undefined,
            content: !visibleAlgorithms && !isSavedProvider ? (
                <p className="text-sm text-gray-400 italic text-center py-6">
                    Fetch metadata to preview algorithms. Save provider to keep them.
                </p>
            ) : visibleAlgorithms ? (
                <div className="border border-gray-200 rounded bg-white overflow-hidden">
                    {visibleAlgorithms.map(({ algorithm, parameters }) => (
                        <AlgorithmRow
                            key={`draft-${algorithm.id}-${algorithm.name}`}
                            algo={algorithm}
                            parameters={parameters}
                            expanded={!!algoExpanded[algorithm.id]}
                            onToggle={() => toggleAlgo(algorithm.id)}
                        />
                    ))}
                </div>
            ) : !algorithms || algorithms.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-6">
                    No algorithms. Fetch metadata first.
                </p>
            ) : (
                <div className="border border-gray-200 rounded bg-white overflow-hidden">
                    {algorithms.map((algo) => (
                        <AlgorithmRow
                            key={`${algo.id}-${algo.computationProviderId}`}
                            algo={algo}
                            expanded={!!algoExpanded[algo.id]}
                            onToggle={() => toggleAlgo(algo.id)}
                        />
                    ))}
                </div>
            ),
        },
    ];

    return (
        <CardModal
            isOpen={isOpen}
            title="Computation Provider"
            shortcutToken="computation-provider-card"
            onClose={handleClose}
            canCloseOnEscape={!isConfirmationModalOpen}
            header={headerConfig}
            actionBarActions={[
                {
                    id: "test-connection",
                    icon: "wifi",
                    label: "Test Connection",
                    onClick: handleTestConnection,
                    disabled: !canTestConnection,
                    loading: testActionFeedback.status === "loading",
                    status: testActionFeedback.status,
                    statusMessage: testActionFeedback.message,
                },
                {
                    id: "fetch-metadata",
                    icon: "cloud_sync",
                    label: "Fetch Metadata",
                    onClick: handleFetchMetadata,
                    disabled: !canFetchMetadata,
                    loading: fetchActionFeedback.status === "loading",
                    status: fetchActionFeedback.status,
                    statusMessage: fetchActionFeedback.message,
                },
            ]}
            fastTabs={fastTabs}
            sections={sections}
        />
    );
}
