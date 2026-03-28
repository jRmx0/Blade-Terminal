import { useCallback, useEffect, useMemo, useState } from "react";
import { useAlgorithmCardStore } from "@/features/computation-provider/stores/algorithmCardStore";
import type {
    CardModalFastTabConfig,
    CardModalHeaderConfig,
    CardModalListPartConfig,
    CardModalListPartRowId,
} from "@/components/modals/card-modal/CardModal";
import {
    ALGORITHM_LAYER_COLUMNS,
    ALGORITHM_PARAMETER_COLUMNS,
    buildLayerRows,
    buildParameterRows,
} from "@/features/computation-provider/utils/algorithmSectionModel";
import { useComputationCatalogStore } from "@/stores/computationCatalogStore";
import { useLayerSettingsStore } from "@/stores/layerSettingsStore";

const DEFAULT_FAST_TAB_OPEN_STATE: Record<string, boolean> = { general: true, parameters: true, layers: true };

export function useAlgorithmCardController() {
    const { isOpen, algorithmDetails, close } = useAlgorithmCardStore();

    const [fastTabOpen, setFastTabOpen] = useState<Record<string, boolean>>(DEFAULT_FAST_TAB_OPEN_STATE);
    const [paramExpanded, setParamExpanded] = useState<Record<string, boolean>>({});
    const [layerExpanded, setLayerExpanded] = useState<Record<string, boolean>>({});
    const [selectedParameterRowIds, setSelectedParameterRowIds] = useState<CardModalListPartRowId[]>([]);

    const algorithm = algorithmDetails?.algorithm ?? null;
    const parameters = algorithmDetails?.parameters ?? [];
    const layers = algorithmDetails?.layers ?? [];

    const allLayerSettings = useLayerSettingsStore((s) => s.layers);
    const layerSettingsSetup = useComputationCatalogStore((s) => s.layerSettingsSetup);

    useEffect(() => {
        if (!isOpen) {
            setFastTabOpen(DEFAULT_FAST_TAB_OPEN_STATE);
            setParamExpanded({});
            setLayerExpanded({});
            setSelectedParameterRowIds([]);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        close();
    }, [close]);

    const toggleFastTab = useCallback((key: string) => {
        setFastTabOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const toggleParamSection = useCallback((rowId: string | number) => {
        const key = String(rowId);
        setParamExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
    }, []);

    const toggleLayerSection = useCallback((rowId: string | number) => {
        const key = String(rowId);
        setLayerExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
    }, []);

    const headerConfig = useMemo<CardModalHeaderConfig>(() => ({
        recordId: algorithm?.id ?? null,
        recordName: algorithm?.name ?? "",
        savedState: algorithm !== null ? "saved" : "nothing_to_save",
        onSave: () => undefined,
        canSave: false,
        isEditMode: false,
        onEdit: () => undefined,
        onNew: () => undefined,
        onDelete: () => undefined,
        canEdit: false,
        canNew: false,
        canDelete: false,
    }), [algorithm]);

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

    const algorithmLayers = useMemo(
        () => algorithm
            ? allLayerSettings
                .map((l) => l.layer)
                .filter((l) => l.algorithmId === algorithm.id && l.providerId === algorithm.computationProviderId)
            : [],
        [algorithm, allLayerSettings],
    );

    const layersListPartRows = useMemo(
        () => {
            if (!algorithm) return [];
            const filteredSetups = layerSettingsSetup.filter(
                (s) => s.algorithmId === algorithm.id && s.providerId === algorithm.computationProviderId,
            );
            return buildLayerRows(
                algorithm.id,
                algorithm.computationProviderId,
                algorithmLayers,
                filteredSetups,
                layerExpanded,
                toggleLayerSection,
            );
        },
        [algorithm, algorithmLayers, layerExpanded, layerSettingsSetup, toggleLayerSection],
    );

    const layersListPart = useMemo<CardModalListPartConfig>(() => ({
        columns: ALGORITHM_LAYER_COLUMNS,
        rows: layersListPartRows,
        emptyMessage: "No layers defined for this algorithm.",
        maxHeightClassName: "max-h-96",
        storageKey: "algorithm-layers",
    }), [layersListPartRows]);

    const fastTabs = useMemo<CardModalFastTabConfig[]>(() => [
        {
            id: "general",
            title: "General",
            expanded: !!fastTabOpen.general,
            onToggle: () => toggleFastTab("general"),
            fields: [
                {
                    id: "name",
                    label: "Name",
                    value: algorithm?.name ?? "",
                    disabled: true,
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
        {
            id: "layers",
            title: "Layers",
            expanded: !!fastTabOpen.layers,
            onToggle: () => toggleFastTab("layers"),
            listPart: layersListPart,
        },
    ], [algorithm, fastTabOpen.general, fastTabOpen.layers, fastTabOpen.parameters, layers.length, layersListPart, parameters.length, parametersListPart, toggleFastTab]);

    return {
        isOpen,
        isConfirmationModalOpen: false,
        handleClose,
        headerConfig,
        fastTabs,
    };
}
