import InspectorPanelSectionSelectField from "@/components/inspector-panel/InspectorPanelSectionSelectField";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useEnvPointStore } from "@/stores/envPointStore";
import { useEnvStore } from "@/stores/envStore";
import { useConfirmationModalStore } from "@/stores/confirmationModalStore";
import type { EnvPointType } from "@/types/schemaTypes";

const POINT_TYPE_OPTIONS = [
    { value: "start", label: "Start" },
    { value: "end", label: "End" },
];

export default function PointTypeField() {
    const selectedEnvPointType = useCanvasSelectionStore((s) => s.selectedEnvPointType);
    const selectEnvPoint = useCanvasSelectionStore((s) => s.selectEnvPoint);
    const startPoint = useEnvPointStore((s) => s.startPoint);
    const endPoint = useEnvPointStore((s) => s.endPoint);
    const changePointType = useEnvPointStore((s) => s.changePointType);
    const envId = useEnvStore((s) => s.env.id);
    const requestConfirmation = useConfirmationModalStore((s) => s.requestConfirmation);

    if (!selectedEnvPointType) return null;

    function handleChange(newType: string) {
        const toType = newType as EnvPointType;
        if (toType === selectedEnvPointType) return;

        const conflictPoint = toType === "start" ? startPoint : endPoint;

        if (conflictPoint) {
            requestConfirmation({
                title: "Point type already in use",
                message: `A ${toType} point already exists. Continuing will remove it.`,
                tone: "warning",
                confirmLabel: "Continue",
                confirmAction: async () => {
                    await changePointType(envId, selectedEnvPointType!, toType);
                    selectEnvPoint(toType);
                },
            });
        } else {
            changePointType(envId, selectedEnvPointType!, toType).then(() => {
                selectEnvPoint(toType);
            });
        }
    }

    return (
        <InspectorPanelSectionSelectField
            label="Type"
            value={selectedEnvPointType}
            options={POINT_TYPE_OPTIONS}
            onChange={handleChange}
        />
    );
}
