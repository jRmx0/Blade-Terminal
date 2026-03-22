import type { LayerSettingParameter } from "@/types/layerTypes";
import { POLYGON_EDGE_STYLE, POLYGON_FILL_STYLE } from "@/config/layers/layerRegistry";
import SettingsPanelInput from "@/components/settings-panel/SettingsPanelInput";
import SettingsPanelSelect from "@/components/settings-panel/SettingsPanelSelect";
import SettingsPanelColorInput from "@/components/settings-panel/SettingsPanelColorInput";

// ─── Param type classification ────────────────────────────────────────────────
const NUMBER_PARAMS = new Set(["Z-Index", "Polygon Edge Width"]);
const COLOR_PARAMS = new Set(["Polygon Edge Color", "Polygon Fill Color", "Grid Line Color"]);
const STYLE_OPTIONS: Record<string, { value: string; label: string }[]> = {
    "Polygon Edge Style": Object.values(POLYGON_EDGE_STYLE).map((v) => ({ value: v, label: v })),
    "Polygon Fill Style": Object.values(POLYGON_FILL_STYLE).map((v) => ({ value: v, label: v })),
};

// ─── Individual setting field ─────────────────────────────────────────────────
interface SettingFieldProps {
    param: LayerSettingParameter;
    disabled: boolean;
    onParamChange: (name: string, value: string) => void;
}

function SettingField({ param, disabled, onParamChange }: SettingFieldProps) {
    const { name, value } = param;

    const selectOptions = STYLE_OPTIONS[name];
    if (selectOptions) {
        return (
            <SettingsPanelSelect
                label={name}
                value={value}
                options={selectOptions}
                disabled={disabled}
                onChange={(v) => onParamChange(name, v)}
            />
        );
    }

    if (NUMBER_PARAMS.has(name)) {
        return (
            <SettingsPanelInput
                label={name}
                value={value}
                type="number"
                disabled={disabled}
                onChange={(v) => onParamChange(name, v)}
            />
        );
    }

    if (COLOR_PARAMS.has(name)) {
        return (
            <SettingsPanelColorInput
                label={name}
                value={value}
                disabled={disabled}
                onChange={(v) => onParamChange(name, v)}
            />
        );
    }

    // Text fallback
    return (
        <SettingsPanelInput
            label={name}
            value={value}
            disabled={disabled}
            onChange={(v) => onParamChange(name, v)}
        />
    );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
interface LayerSettingsPanelProps {
    settings: LayerSettingParameter[];
    disabled: boolean;
    onParamChange: (name: string, value: string) => void;
}

export default function LayerSettingsPanel({ settings, disabled, onParamChange }: LayerSettingsPanelProps) {
    const visible = settings.filter((p) => p.name !== "Visible");

    if (visible.length === 0) return null;

    return (
        <div className="border-t border-gray-100 bg-gray-50 py-1">
            {visible.map((param) => (
                <SettingField
                    key={param.name}
                    param={param}
                    disabled={disabled}
                    onParamChange={onParamChange}
                />
            ))}
        </div>
    );
}
