import { useEffect } from "react";
import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import { ENV_FORMAT_OPTIONS, type EnvFormat } from "@/config/db-ops/enums";
import { setParameterValue } from "@server/db/environmentComputationParameterValues";
import { useEnvStore } from "@/stores/envStore";

function formatToMetadataValue(format: EnvFormat): string {
    const matchingOption = ENV_FORMAT_OPTIONS.find((option) => option.value === format);
    return matchingOption?.label ?? format;
}

interface FormatSelectionProps {
    providerId?: number;
    algorithmId?: number;
    parameterId?: number;
    parameterName?: string;
    enumValues?: string[];
}

export default function FormatSelection({
    providerId,
    algorithmId,
    parameterId,
    parameterName,
    enumValues,
}: FormatSelectionProps) {
    const envId = useEnvStore((state) => state.env.id);
    const format = useEnvStore((state) => state.env.format);
    const setFormat = useEnvStore((state) => state.setFormat);

    useEffect(() => {
        if (providerId === undefined || algorithmId === undefined || parameterId === undefined) return;
        setParameterValue(parameterId, algorithmId, providerId, envId, formatToMetadataValue(format)).catch(console.error);
    }, [algorithmId, envId, format, parameterId, providerId]);

    function handleChange(nextValue: string) {
        const nextFormat = nextValue as EnvFormat;
        setFormat(nextFormat);

        if (providerId !== undefined && algorithmId !== undefined && parameterId !== undefined) {
            setParameterValue(parameterId, algorithmId, providerId, envId, formatToMetadataValue(nextFormat)).catch(console.error);
        }
    }

    const options = enumValues === undefined
        ? ENV_FORMAT_OPTIONS
        : ENV_FORMAT_OPTIONS.filter((opt) => enumValues.includes(opt.label));

    return (
        <ControlsPanelSectionSelect
            label={parameterName ?? "Format"}
            value={format}
            onChange={handleChange}
            options={options}
        />
    );
}