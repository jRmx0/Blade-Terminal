import { useEffect } from "react";
import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import { ENV_FORMAT_OPTIONS, type EnvFormat } from "@/config/db-ops/enums";
import { useEnvStore } from "@/stores/envStore";

function formatToMetadataValue(format: EnvFormat): string {
    const matchingOption = ENV_FORMAT_OPTIONS.find((option) => option.value === format);
    return matchingOption?.label ?? format;
}

interface FormatSelectionProps {
    providerId?: number;
    algorithmId?: number;
    parameterName?: string;
    enumValues?: string[];
}

export default function FormatSelection({
    providerId,
    algorithmId,
    parameterName,
    enumValues,
}: FormatSelectionProps) {
    const format = useEnvStore((state) => state.env.format);
    const setFormat = useEnvStore((state) => state.setFormat);
    const setComputationParameterValue = useEnvStore((state) => state.setComputationParameterValue);

    useEffect(() => {
        if (providerId === undefined || algorithmId === undefined || parameterName === undefined) return;
        setComputationParameterValue(providerId, algorithmId, parameterName, formatToMetadataValue(format));
    }, [algorithmId, format, parameterName, providerId, setComputationParameterValue]);

    function handleChange(nextValue: string) {
        const nextFormat = nextValue as EnvFormat;
        setFormat(nextFormat);

        if (providerId !== undefined && algorithmId !== undefined && parameterName !== undefined) {
            setComputationParameterValue(providerId, algorithmId, parameterName, formatToMetadataValue(nextFormat));
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