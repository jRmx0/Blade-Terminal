import { useCallback, useEffect, useMemo, useState } from "react";
import { updateAlgorithmName, deleteAlgorithmWithParameters } from "@server/db/computationProviderAlgorithms";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useAlgorithmCardStore } from "@/features/computation-provider/stores/algorithmCardStore";
import { useDeleteModalStore } from "@/features/workspace-manager/stores/deleteModalStore";
import { useConfirmationModalStore } from "@/stores/confirmationModalStore";
import type {
    CardModalFastTabConfig,
    CardModalHeaderConfig,
    CardModalListPartConfig,
    CardModalListPartRowId,
    CardModalSavedState,
} from "@/components/modals/card-modal/CardModal";
import {
    ALGORITHM_PARAMETER_COLUMNS,
    buildParameterRows,
} from "@/features/computation-provider/utils/algorithmSectionModel";
import type { ComputationAlgorithmDetails } from "@/types/serviceTypes";

const DEFAULT_FAST_TAB_OPEN_STATE: Record<string, boolean> = { general: true, parameters: true };

export function useAlgorithmCardController() {
    const {
        isOpen,
        algorithmDetails,
        isDraft,
        onDraftSave,
        onDraftDelete,
        close,
    } = useAlgorithmCardStore();
    const isConfirmationModalOpen = useConfirmationModalStore((state) => state.isOpen);

    const [name, setName] = useState("");
    const [savedName, setSavedName] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [fastTabOpen, setFastTabOpen] = useState<Record<string, boolean>>(DEFAULT_FAST_TAB_OPEN_STATE);
    const [paramExpanded, setParamExpanded] = useState<Record<string, boolean>>({});
    const [selectedParameterRowIds, setSelectedParameterRowIds] = useState<CardModalListPartRowId[]>([]);

    const algorithm = algorithmDetails?.algorithm ?? null;
    const parameters = algorithmDetails?.parameters ?? [];
    const layers = algorithmDetails?.layers ?? [];

    useEffect(() => {
        if (!isOpen || !algorithmDetails) {
            setName("");
            setSavedName("");
            setIsEditMode(false);
            setIsSaving(false);
            setFastTabOpen(DEFAULT_FAST_TAB_OPEN_STATE);
            setParamExpanded({});
            setSelectedParameterRowIds([]);
            return;
        }

        const initialName = algorithmDetails.algorithm.name;
        setName(initialName);
        setSavedName(initialName);
        setIsEditMode(false);
    }, [isOpen, algorithmDetails]);

    const isDirty = name !== savedName;
    const canSave = Boolean(name.trim());
    const savedState: CardModalSavedState = isDirty || isDraft ? "unsaved" : algorithm === null ? "nothing_to_save" : "saved";

    const toggleFastTab = useCallback((key: string) => {
        setFastTabOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const toggleParamSection = useCallback((rowId: string | number) => {
        const key = String(rowId);
        setParamExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
    }, []);

    const handleSave = useCallback(async () => {
        if (!algorithm || !algorithmDetails || isSaving || !canSave) return;

        setIsSaving(true);
        try {
            if (isDraft) {
                if (!onDraftSave) return;
                const updatedDetails: ComputationAlgorithmDetails = {
                    ...algorithmDetails,
                    algorithm: { ...algorithm, name },
                };
                const success = await onDraftSave(updatedDetails);
                if (success) {
                    useAlgorithmCardStore.getState().openSaved(updatedDetails);
                }
            } else {
                await updateAlgorithmName(algorithm.id, algorithm.computationProviderId, name);
                useComputationCatalogStore.getState().upsertAlgorithm({ ...algorithm, name });
                setSavedName(name);
                setIsEditMode(false);
            }
        } finally {
            setIsSaving(false);
        }
    }, [algorithm, algorithmDetails, canSave, isDraft, isSaving, name, onDraftSave]);

    const handleDelete = useCallback(() => {
        if (!algorithm) return;

        useDeleteModalStore.getState().requestDelete(algorithm.name || "this algorithm", async () => {
            if (isDraft) {
                onDraftDelete?.();
            } else {
                await deleteAlgorithmWithParameters(algorithm.id, algorithm.computationProviderId);
                useComputationCatalogStore.getState().removeAlgorithm(algorithm.id, algorithm.computationProviderId);
            }
            close();
        });
    }, [algorithm, close, isDraft, onDraftDelete]);

    const handleClose = useCallback(() => {
        if (isDirty) {
            useConfirmationModalStore.getState().requestConfirmation({
                title: "Unsaved Changes",
                message: "Your changes will be lost if you don't save them.",
                tone: "warning",
                confirmLabel: "Save",
                secondaryLabel: "Don't Save",
                cancelLabel: "Cancel",
                confirmDisabled: !canSave || isSaving,
                confirmAction: async () => {
                    await handleSave();
                },
                secondaryAction: async () => {
                    close();
                },
            });
            return;
        }
        close();
    }, [canSave, close, handleSave, isDirty, isSaving]);

    const headerConfig = useMemo<CardModalHeaderConfig>(() => ({
        recordId: algorithm?.id ?? null,
        recordName: name,
        savedState,
        onSave: () => { handleSave().catch(console.error); },
        canSave,
        isEditMode,
        onEdit: () => setIsEditMode((v) => !v),
        onNew: () => undefined,
        onDelete: handleDelete,
        canNew: false,
        canDelete: false,
    }), [algorithm, canSave, handleDelete, handleSave, isEditMode, name, savedState]);

    const parametersListPartRows = useMemo(
        () => {
            if (!algorithm) return [];
            return buildParameterRows(algorithm.id, parameters).map((row) => {
                if (row.kind !== "group") return row;
                const key = String(row.id);
                return {
                    ...row,
                    expanded: paramExpanded[key] ?? true,
                    onToggle: () => toggleParamSection(row.id),
                };
            });
        },
        [algorithm, paramExpanded, parameters, toggleParamSection],
    );

    const parametersListPart = useMemo<CardModalListPartConfig>(() => ({
        columns: ALGORITHM_PARAMETER_COLUMNS,
        rows: parametersListPartRows,
        emptyMessage: "No parameters defined for this algorithm.",
        maxHeightClassName: "max-h-96",
        storageKey: "algorithm-parameters",
        selectedRowIds: selectedParameterRowIds,
        onSelectedRowIdsChange: setSelectedParameterRowIds,
    }), [parametersListPartRows, selectedParameterRowIds]);

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
                    value: name,
                    required: true,
                    disabled: !isEditMode,
                    onChange: setName,
                },
                {
                    id: "parameter-count",
                    label: "Number of Parameters",
                    value: String(parameters.length),
                    disabled: true,
                },
                {
                    id: "layer-count",
                    label: "Number of Layers",
                    value: String(layers.length),
                    disabled: true,
                },
            ],
        },
        {
            id: "parameters",
            title: "Parameters",
            expanded: !!fastTabOpen.parameters,
            onToggle: () => toggleFastTab("parameters"),
            listPart: parametersListPart,
        },
    ], [fastTabOpen.general, fastTabOpen.parameters, isEditMode, layers.length, name, parameters.length, parametersListPart, toggleFastTab]);

    return {
        isOpen,
        isConfirmationModalOpen,
        handleClose,
        headerConfig,
        fastTabs,
    };
}
