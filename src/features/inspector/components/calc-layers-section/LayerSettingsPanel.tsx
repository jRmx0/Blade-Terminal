import type { LayerSettingParameter } from "@/types/layerTypes";
import { POLYGON_EDGE_STYLE, POLYGON_FILL_STYLE } from "@/config/layers/layerRegistry";
import SettingsPanelRowInput from "@/components/settings-panel/SettingsPanelRowInput";
import SettingsPanelRowSelect from "@/components/settings-panel/SettingsPanelRowSelect";
import SettingsPanelRowColorInput from "@/components/settings-panel/SettingsPanelRowColorInput";
import SettingsPanelRowToggle from "@/components/settings-panel/SettingsPanelRowToggle";
import SettingsPanelSeparator from "@/components/settings-panel/SettingsPanelSeparator";

// ─── Param type classification ──────────────────────────────────────────────
const TOGGLE_PARAMS = new Set(["Show Vertex IDs"]);
const PARAM_TOOLTIPS: Record<string, string> = {
    "Show Vertex IDs": "Vertex IDs are visible only when the Select tool is active",
};
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
            <SettingsPanelRowSelect
                label={name}
                value={value}
                options={selectOptions}
                disabled={disabled}
                onChange={(v) => onParamChange(name, v)}
            />
        );
    }

    if (TOGGLE_PARAMS.has(name)) {
        return (
            <SettingsPanelRowToggle
                label={name}
                value={value === "true"}
                disabled={disabled}
                tooltip={PARAM_TOOLTIPS[name]}
                onChange={(v) => onParamChange(name, String(v))}
            />
        );
    }

    if (NUMBER_PARAMS.has(name)) {
        return (
            <SettingsPanelRowInput
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
            <SettingsPanelRowColorInput
                label={name}
                value={value}
                disabled={disabled}
                onChange={(v) => onParamChange(name, v)}
            />
        );
    }

    // Text fallback
    return (
        <SettingsPanelRowInput
            label={name}
            value={value}
            disabled={disabled}
            onChange={(v) => onParamChange(name, v)}
        />
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────
export interface SettingsSectionData {
    label: string;
    settings: LayerSettingParameter[];
    onParamChange: (name: string, value: string) => void;
}

// ─── Panel ────────────────────────────────────────────────────────────────────
interface LayerSettingsPanelProps {
    sections: SettingsSectionData[];
    disabled: boolean;
}

export default function LayerSettingsPanel({ sections, disabled }: LayerSettingsPanelProps) {
    const showSectionLabels = sections.length > 1;
    const nonEmpty = sections.filter((s) => s.settings.some((p) => p.name !== "Visible"));

    if (nonEmpty.length === 0) return null;

    return (
        <div className="border-t border-gray-100 bg-gray-50 py-1">
            {nonEmpty.map((section, idx) => {
                const visibleParams = section.settings.filter((p) => p.name !== "Visible");
                return (
                    <div key={section.label} className={idx > 0 ? "mt-2" : ""}>
                        {showSectionLabels && (
                            <SettingsPanelSeparator label={section.label} />
                        )}
                        {visibleParams.map((param) => (
                            <SettingField
                                key={param.name}
                                param={param}
                                disabled={disabled}
                                onParamChange={section.onParamChange}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
