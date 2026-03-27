import type { LayerSettingParameter } from "@/types/layerTypes";
import SettingsPanelRowInput from "@/components/settings-panel/SettingsPanelRowInput";
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

// ─── Individual setting field ─────────────────────────────────────────────────
interface SettingFieldProps {
    param: LayerSettingParameter;
    disabled: boolean;
    onParamChange: (name: string, value: string) => void;
}

function SettingField({ param, disabled, onParamChange }: SettingFieldProps) {
    const { key, value } = param;

    if (TOGGLE_PARAMS.has(key)) {
        return (
            <SettingsPanelRowToggle
                label={key}
                value={value === "true"}
                disabled={disabled}
                tooltip={PARAM_TOOLTIPS[key]}
                onChange={(v) => onParamChange(key, String(v))}
            />
        );
    }

    if (NUMBER_PARAMS.has(key)) {
        return (
            <SettingsPanelRowInput
                label={key}
                value={value}
                type="number"
                disabled={disabled}
                onChange={(v) => onParamChange(key, v)}
            />
        );
    }

    if (COLOR_PARAMS.has(key)) {
        return (
            <SettingsPanelRowColorInput
                label={key}
                value={value}
                disabled={disabled}
                onChange={(v) => onParamChange(key, v)}
            />
        );
    }

    // Text fallback
    return (
        <SettingsPanelRowInput
            label={key}
            value={value}
            disabled={disabled}
            onChange={(v) => onParamChange(key, v)}
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
    disabled?: boolean;
}

export default function LayerSettingsPanel({ sections, disabled = false }: LayerSettingsPanelProps) {
    const showSectionLabels = sections.length > 1;
    const nonEmpty = sections.filter((s) => s.settings.some((p) => p.key !== "Visible"));

    if (nonEmpty.length === 0) return null;

    return (
        <div className="border-t border-gray-100 bg-gray-50 py-1">
            {nonEmpty.map((section, idx) => {
                const visibleParams = section.settings.filter((p) => p.key !== "Visible");
                return (
                    <div key={section.label} className={idx > 0 ? "mt-2" : ""}>
                        {showSectionLabels && (
                            <SettingsPanelSeparator label={section.label} />
                        )}
                        {visibleParams.map((param) => (
                            <SettingField
                                key={param.key}
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
