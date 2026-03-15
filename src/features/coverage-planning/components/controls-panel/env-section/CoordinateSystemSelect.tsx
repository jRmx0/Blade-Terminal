import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import type { AlgorithmParameter, AppEnumValue } from "@/types/serviceTypes";
import { getEnvironmentComputationParameterValue } from "@/utils/environmentComputation";
import { useEnvStore } from "@/stores/envStore";

interface CoordinateSystemSelectProps {
    parameter: AlgorithmParameter;
    appEnums: AppEnumValue[];
}

function buildCoordinateSystemOptions(appEnums: AppEnumValue[], fallbackValues: string[]): Array<{ value: string; label: string }> {
    if (fallbackValues.length === 0) {
        return [];
    }

    const matchingEnums = appEnums.filter((item) => item.enumGroup === "coordsystem");

    return fallbackValues.map((value) => ({
        value,
        label: matchingEnums.find((item) => item.value === value)?.label ?? value,
    }));
}

export default function CoordinateSystemSelect({
    parameter,
    appEnums,
}: CoordinateSystemSelectProps) {
    const computation = useEnvStore((state) => state.env.computation);
    const setComputationParameterValue = useEnvStore((state) => state.setComputationParameterValue);

    const value = getEnvironmentComputationParameterValue(
        computation,
        parameter.computationProviderId,
        parameter.algorithmId,
        parameter.name,
    )
        ?? parameter.defaultValue
        ?? "";

    return (
        <ControlsPanelSectionSelect
            label={parameter.name}
            value={value}
            onChange={(nextValue) => setComputationParameterValue(
                parameter.computationProviderId,
                parameter.algorithmId,
                parameter.name,
                nextValue,
            )}
            options={buildCoordinateSystemOptions(appEnums, parameter.enumValues)}
        />
    );
}