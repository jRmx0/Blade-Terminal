import { useEffect } from "react";
import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import {
    GLOBAL_TYPE_OPTIONS,
    defaultObjectTypeForGlobal,
    isGlobalTypeFixed,
    type GlobalType,
} from "@/config/db-ops/enums";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useEnvStore } from "@/stores/envStore";
import { useConfirmationModalStore } from "@/stores/confirmationModalStore";

function globalTypeToMetadataValue(type: GlobalType): string {
    const matchingOption = GLOBAL_TYPE_OPTIONS.find((option) => option.value === type);
    return matchingOption?.label ?? type;
}

interface GlobalTypeSelectionProps {
    providerId?: number;
    algorithmId?: number;
    parameterName?: string;
    enumValues?: string[];
}

export default function GlobalTypeSelection({
    providerId,
    algorithmId,
    parameterName,
    enumValues,
}: GlobalTypeSelectionProps) {
    const type = useEnvStore((state) => state.env.type);
    const setType = useEnvStore((state) => state.setType);
    const setComputationParameterValue = useEnvStore((state) => state.setComputationParameterValue);
    const objects = useCanvasObjectStore((state) => state.objects);
    const updateObjectsType = useCanvasObjectStore((state) => state.updateObjectsType);

    useEffect(() => {
        if (providerId === undefined || algorithmId === undefined || parameterName === undefined) return;
        setComputationParameterValue(providerId, algorithmId, parameterName, globalTypeToMetadataValue(type));
    }, [algorithmId, parameterName, providerId, setComputationParameterValue, type]);

    function applyType(nextType: GlobalType) {
        setType(nextType);

        if (providerId !== undefined && algorithmId !== undefined && parameterName !== undefined) {
            setComputationParameterValue(providerId, algorithmId, parameterName, globalTypeToMetadataValue(nextType));
        }
    }

    function handleChange(newValue: string) {
        const nextType = newValue as GlobalType;

        if (isGlobalTypeFixed(nextType)) {
            const nextObjectType = defaultObjectTypeForGlobal(nextType);
            const mismatchCount = objects.filter((object) => object.type !== nextObjectType).length;

            if (mismatchCount > 0) {
                const typeLabel = nextObjectType === "online" ? "On-Line" : "Off-Line";
                useConfirmationModalStore.getState().requestConfirmation({
                    title: "Update object types",
                    message: `${mismatchCount} object${mismatchCount !== 1 ? "s" : ""} will be updated to "${typeLabel}" to match the new global type. Continue?`,
                    tone: "warning",
                    confirmLabel: "Confirm",
                    cancelLabel: "Cancel",
                    confirmAction: async () => {
                        updateObjectsType(nextObjectType);
                        applyType(nextType);
                    },
                });
                return;
            }

            updateObjectsType(nextObjectType);
        }

        applyType(nextType);
    }

    const options = enumValues === undefined
        ? GLOBAL_TYPE_OPTIONS
        : GLOBAL_TYPE_OPTIONS.filter((opt) => enumValues.includes(opt.label));

    return (
        <ControlsPanelSectionSelect
            label={parameterName ?? "Global Type"}
            value={type}
            onChange={handleChange}
            options={options}
        />
    );
}