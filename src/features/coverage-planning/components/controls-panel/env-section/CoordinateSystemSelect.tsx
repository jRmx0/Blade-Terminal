import ControlsPanelSectionSelect from "@/components/controls-panel/ControlsPanelSectionSelect";
import type { AlgorithmParameter, AppEnumValue } from "@/types/serviceTypes";
import { useParameterValuesStore } from "@/stores/parameterValuesStore";
import { useEnvStore } from "@/stores/envStore";

interface CoordinateSystemSelectProps {
    parameter: AlgorithmParameter;
    currentValue: string;
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
    currentValue,
    appEnums,
}: CoordinateSystemSelectProps) {
    const envId = useEnvStore((state) => state.env.id);
    const setParameterValue = useParameterValuesStore((state) => state.setParameterValue);

    return (
        <ControlsPanelSectionSelect
            label={parameter.name}
            value={currentValue}
            onChange={(nextValue) => setParameterValue(
                parameter.id,
                parameter.algorithmId,
                parameter.computationProviderId,
                envId,
                nextValue,
            )}
            options={buildCoordinateSystemOptions(appEnums, parameter.enumValues)}
        />
    );
}