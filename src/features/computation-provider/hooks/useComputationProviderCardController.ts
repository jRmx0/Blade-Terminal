import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@server/db/db";
import { saveComputationProvider, deleteComputationProvider } from "@server/db/computationProviders";
import type { ModalActionBarItem } from "@/components/modal/modal-action-bar/ModalActionBar";
import type {
    CardModalFastTabConfig,
    CardModalHeaderConfig,
    CardModalSavedState,
} from "@/components/modals/card-modal/CardModal";
import type {
    CardModalListPartConfig,
    CardModalListPartRowId,
} from "@/components/modals/card-modal/CardModalListPart.types";
import { testConnection, fetchMetadataPreview, persistFetchedMetadata } from "@/features/computation-provider/data/computationProviderService";
import { useComputationProviderAutosave } from "@/features/computation-provider/hooks/useComputationProviderAutosave";
import { useComputationProviderCardStore } from "@/features/computation-provider/stores/computationProviderCardStore";
import { useComputationProvidersListModalStore } from "@/features/computation-provider/stores/computationProvidersListModalStore";
import {
    ALGORITHM_PARAMETER_COLUMNS,
    buildAlgorithmSectionRows,
    buildSavedAlgorithmDetails,
} from "@/features/computation-provider/utils/algorithmSectionModel";
import {
    areComputationProviderFormsEqual,
    areFetchedComputationMetadataEqual,
    EMPTY_COMPUTATION_PROVIDER_FORM,
    normalizeComputationProviderForm,
    sleep,
    toComputationProviderFormState,
    type ComputationProviderForm,
    withMinimumLoadingTime,
} from "@/features/computation-provider/utils/computationProviderCardState";
import { validateComputationProviderUrl } from "@/features/computation-provider/utils/computationProviderUrl";
import { useDeleteModalStore } from "@/features/workspace-manager/stores/deleteModalStore";
import { useConfirmationModalStore } from "@/stores/confirmationModalStore";
import type {
    AlgorithmParameter,
    ComputationAlgorithm,
    ComputationProvider,
    FetchedComputationMetadata,
} from "@/types/serviceTypes";
import type { ModalActionStatus } from "@/components/modal/modal-action-bar/ModalActionBarAction";

const EMPTY_ACTION_FEEDBACK: ActionFeedback = {};
const DEFAULT_FAST_TAB_OPEN_STATE = {
    general: true,
    algorithms: true,
};
const MIN_ACTION_LOADING_MS = 500;

type ActionFeedback = {
    status?: ModalActionStatus;
    message?: string;
};

export function useComputationProviderCardController() {
    const {
        isOpen,
        selectedProviderId,
        close,
        setSelectedProviderId,
    } = useComputationProviderCardStore();
    const openList = useComputationProvidersListModalStore((state) => state.open);
    const isConfirmationModalOpen = useConfirmationModalStore((state) => state.isOpen);

    const [form, setForm] = useState<ComputationProviderForm>(EMPTY_COMPUTATION_PROVIDER_FORM);
    const [savedForm, setSavedForm] = useState<ComputationProviderForm>(EMPTY_COMPUTATION_PROVIDER_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [fastTabOpen, setFastTabOpen] = useState<Record<string, boolean>>(DEFAULT_FAST_TAB_OPEN_STATE);
    const [algoExpanded, setAlgoExpanded] = useState<Record<string, boolean>>({});
    const [selectedAlgorithmRowIds, setSelectedAlgorithmRowIds] = useState<CardModalListPartRowId[]>([]);
    const [draftMetadata, setDraftMetadata] = useState<FetchedComputationMetadata | null>(null);
    const [testActionFeedback, setTestActionFeedback] = useState<ActionFeedback>(EMPTY_ACTION_FEEDBACK);
    const [fetchActionFeedback, setFetchActionFeedback] = useState<ActionFeedback>(EMPTY_ACTION_FEEDBACK);
    const [isSaving, setIsSaving] = useState(false);
    const savePromiseRef = useRef<Promise<boolean> | null>(null);
    const isDirtyRef = useRef(false);
    const canSaveRef = useRef(false);
    const skipNextProviderLoadRef = useRef<number | null>(null);

    const algorithms = useLiveQuery<ComputationAlgorithm[]>(
        () => (
            editingId !== null
                ? db.table("computationAlgorithms").where("computationProviderId").equals(editingId).toArray()
                : Promise.resolve([])
        ),
        [editingId],
    );
    const algorithmParameters = useLiveQuery<AlgorithmParameter[]>(
        () => (
            editingId !== null
                ? db.table("computationAlgorithmParameters").where("computationProviderId").equals(editingId).toArray()
                : Promise.resolve([])
        ),
        [editingId],
    );

    const normalizedForm = normalizeComputationProviderForm(form);
    const isStale = form.urlAtLastFetch !== null && form.url.trim() !== form.urlAtLastFetch;
    const lastFetchLabel = form.metadataFetchedAt === null
        ? "Never fetched"
        : `Last fetched: ${new Date(form.metadataFetchedAt).toLocaleString()}`;
    const urlValidation = validateComputationProviderUrl(normalizedForm.url);
    const urlError = normalizedForm.url === "" ? undefined : urlValidation.ok ? undefined : urlValidation.error;
    const canSave = Boolean(normalizedForm.name) && urlValidation.ok;
    const canTestConnection = urlValidation.ok;
    const canFetchMetadata = urlValidation.ok;
    const hasDraftAlgorithms = draftMetadata !== null;
    const isDirty = !areComputationProviderFormsEqual(normalizedForm, savedForm) || hasDraftAlgorithms;
    const savedState: CardModalSavedState = isDirty ? "unsaved" : editingId === null ? "nothing_to_save" : "saved";
    const isSavedProvider = editingId !== null;
    const visibleAlgorithms = draftMetadata?.algorithms ?? null;

    const savedAlgorithmDetails = useMemo(
        () => buildSavedAlgorithmDetails({ algorithms, algorithmParameters }),
        [algorithmParameters, algorithms],
    );

    const toggleAlgo = useCallback((rowId: string, defaultExpanded = true) => {
        setAlgoExpanded((previousValue) => ({
            ...previousValue,
            [rowId]: !(previousValue[rowId] ?? defaultExpanded),
        }));
    }, []);

    const algorithmListPartRows = useMemo(
        () => buildAlgorithmSectionRows({
            algorithmDetails: visibleAlgorithms ?? savedAlgorithmDetails,
            isExpanded: (rowId, defaultExpanded = true) => algoExpanded[rowId] ?? defaultExpanded,
            isDraft: visibleAlgorithms !== null,
            onToggle: toggleAlgo,
        }),
        [algoExpanded, savedAlgorithmDetails, toggleAlgo, visibleAlgorithms],
    );

    const algorithmListEmptyMessage = !visibleAlgorithms && !isSavedProvider
        ? "Fetch metadata to preview algorithms. Save provider to keep them."
        : "No algorithms. Fetch metadata first.";

    const resetTransientState = useCallback(() => {
        setAlgoExpanded({});
        setSelectedAlgorithmRowIds([]);
        setDraftMetadata(null);
        setTestActionFeedback(EMPTY_ACTION_FEEDBACK);
        setFetchActionFeedback(EMPTY_ACTION_FEEDBACK);
        setIsSaving(false);
        savePromiseRef.current = null;
    }, []);

    const startNewProviderDraft = useCallback(() => {
        setEditingId(null);
        setForm(EMPTY_COMPUTATION_PROVIDER_FORM);
        setSavedForm(EMPTY_COMPUTATION_PROVIDER_FORM);
        setDraftMetadata(null);
        setIsEditMode(true);
        setTestActionFeedback(EMPTY_ACTION_FEEDBACK);
        setFetchActionFeedback(EMPTY_ACTION_FEEDBACK);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setEditingId(null);
            setForm(EMPTY_COMPUTATION_PROVIDER_FORM);
            setSavedForm(EMPTY_COMPUTATION_PROVIDER_FORM);
            setIsEditMode(false);
            resetTransientState();
            return;
        }

        setEditingId(selectedProviderId);
        setTestActionFeedback(EMPTY_ACTION_FEEDBACK);
        setFetchActionFeedback(EMPTY_ACTION_FEEDBACK);

        if (selectedProviderId === null) {
            setForm(EMPTY_COMPUTATION_PROVIDER_FORM);
            setSavedForm(EMPTY_COMPUTATION_PROVIDER_FORM);
            setDraftMetadata(null);
            return;
        }

        if (skipNextProviderLoadRef.current === selectedProviderId) {
            skipNextProviderLoadRef.current = null;
            return;
        }

        (db.table("computationProviders").get(selectedProviderId) as Promise<ComputationProvider | undefined>).then(
            (provider) => {
                if (provider) {
                    const nextForm = toComputationProviderFormState(provider);
                    setForm(nextForm);
                    setSavedForm(nextForm);
                    setDraftMetadata(null);
                }
            },
        );
    }, [isOpen, resetTransientState, selectedProviderId]);

    useEffect(() => {
        isDirtyRef.current = isDirty;
        canSaveRef.current = canSave;
    }, [canSave, isDirty]);

    const saveProviderChanges = useCallback(async () => {
        if (savePromiseRef.current) {
            return savePromiseRef.current;
        }

        const formSnapshot = normalizeComputationProviderForm(form);
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
                    const normalizedCurrentForm = normalizeComputationProviderForm(currentForm);

                    return areComputationProviderFormsEqual(normalizedCurrentForm, formSnapshot)
                        ? formSnapshot
                        : currentForm;
                });
                setDraftMetadata((currentDraftMetadata) => (
                    areFetchedComputationMetadataEqual(currentDraftMetadata, draftMetadataSnapshot)
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

    const completeClose = useCallback(async () => {
        close();
        openList();
    }, [close, openList]);

    const requestClose = useCallback(async () => {
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
    }, [completeClose, saveProviderChanges]);

    const handleClose = useCallback(() => {
        requestClose().catch(console.error);
    }, [requestClose]);

    const toggleFastTab = useCallback((key: string) => {
        setFastTabOpen((previousValue) => ({ ...previousValue, [key]: !previousValue[key] }));
    }, []);

    const handleSave = useCallback(async () => {
        await saveProviderChanges();
    }, [saveProviderChanges]);

    const handleDelete = useCallback(() => {
        if (editingId === null) {
            return;
        }

        useDeleteModalStore.getState().requestDelete(form.name || "this provider", async () => {
            await deleteComputationProvider(editingId);
            close();
            openList();
        });
    }, [close, editingId, form.name, openList]);

    const providerRecord = useMemo<ComputationProvider>(() => (
        editingId !== null
            ? { ...normalizedForm, id: editingId }
            : normalizedForm
    ), [editingId, normalizedForm]);

    const handleTestConnection = useCallback(async () => {
        if (!providerRecord.url) {
            return;
        }

        setTestActionFeedback({ status: "loading", message: "Testing connection…" });
        const result = await withMinimumLoadingTime(() => testConnection(providerRecord), MIN_ACTION_LOADING_MS);
        setTestActionFeedback(
            result.ok
                ? { status: "success", message: "Connection successful." }
                : { status: "error", message: result.error },
        );
    }, [providerRecord]);

    const handleFetchMetadata = useCallback(async () => {
        if (!providerRecord.url) {
            return;
        }

        setFetchActionFeedback({ status: "loading", message: "Fetching metadata…" });
        const result = await withMinimumLoadingTime(() => fetchMetadataPreview(providerRecord), MIN_ACTION_LOADING_MS);
        if (!result.ok) {
            if ("errorCode" in result && result.errorCode === "unsupported_app_handler") {
                useConfirmationModalStore.getState().requestConfirmation({
                    title: "Unsupported App Handler",
                    message: `This provider uses unsupported application handler(s): ${result.unsupportedHandlers.join(", ")}. Update the provider metadata or add support in the terminal before fetching again.`,
                    tone: "warning",
                    confirmLabel: "OK",
                });
            }

            setFetchActionFeedback({ status: "error", message: result.error });
            return;
        }

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
    }, [editingId, isDirty, providerRecord]);

    const headerConfig = useMemo<CardModalHeaderConfig>(() => ({
        recordId: editingId,
        recordName: form.name.trim(),
        savedState: headerSavedState,
        onSave: handleSave,
        canSave,
        isEditMode,
        onEdit: () => setIsEditMode((value) => !value),
        onNew: startNewProviderDraft,
        onDelete: handleDelete,
        canDelete: editingId !== null,
    }), [canSave, editingId, form.name, handleDelete, handleSave, headerSavedState, isEditMode, startNewProviderDraft]);

    const algorithmsListPart = useMemo<CardModalListPartConfig>(() => ({
        columns: ALGORITHM_PARAMETER_COLUMNS,
        rows: algorithmListPartRows,
        emptyMessage: algorithmListEmptyMessage,
        maxHeightClassName: "max-h-96",
        storageKey: "computation-provider-algorithms",
        selectedRowIds: selectedAlgorithmRowIds,
        onSelectedRowIdsChange: setSelectedAlgorithmRowIds,
    }), [algorithmListEmptyMessage, algorithmListPartRows, selectedAlgorithmRowIds]);

    const fastTabs = useMemo<CardModalFastTabConfig[]>(() => [
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
                    onChange: (value) => setForm((currentForm) => ({ ...currentForm, name: value })),
                },
                {
                    id: "service-url",
                    label: "Service URL",
                    value: form.url,
                    required: true,
                    disabled: !isEditMode,
                    onChange: (value) => setForm((currentForm) => ({ ...currentForm, url: value })),
                    hint: urlError ?? (
                        isStale
                            ? "Metadata may be stale — URL changed since last fetch"
                            : lastFetchLabel
                    ),
                    hintState: urlError
                        ? "error"
                        : isStale
                            ? "warning"
                            : "info",
                },
                {
                    id: "api-key",
                    label: "API Key",
                    value: form.apiKey,
                    type: "password",
                    disabled: !isEditMode,
                    onChange: (value) => setForm((currentForm) => ({ ...currentForm, apiKey: value })),
                },
            ],
        },
        {
            id: "algorithms",
            title: "Algorithms",
            expanded: !!fastTabOpen.algorithms,
            onToggle: () => toggleFastTab("algorithms"),
            listPart: algorithmsListPart,
        },
    ], [algorithmsListPart, fastTabOpen.algorithms, fastTabOpen.general, form.apiKey, form.name, form.url, isEditMode, isStale, lastFetchLabel, toggleFastTab, urlError]);

    const actionBarActions = useMemo<ModalActionBarItem[]>(() => [
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
    ], [canFetchMetadata, canTestConnection, fetchActionFeedback.message, fetchActionFeedback.status, handleFetchMetadata, handleTestConnection, testActionFeedback.message, testActionFeedback.status]);

    return {
        isOpen,
        isConfirmationModalOpen,
        handleClose,
        headerConfig,
        fastTabs,
        actionBarActions,
    };
}
