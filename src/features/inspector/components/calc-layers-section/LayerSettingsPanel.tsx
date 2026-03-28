import type { LayerSettingParameter } from "@/types/layerTypes";
import { LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
import SettingsPanelRowInput from "@/components/settings-panel/SettingsPanelRowInput";
import SettingsPanelRowColorInput from "@/components/settings-panel/SettingsPanelRowColorInput";
import SettingsPanelRowToggle from "@/components/settings-panel/SettingsPanelRowToggle";
import SettingsPanelSeparator from "@/components/settings-panel/SettingsPanelSeparator";

// ─── Param type classification ──────────────────────────────────────────────
const TOGGLE_PARAMS: Set<string> = new Set([LAYER_PARAM_KEY.SHOW_VERTEX_IDS]);
const PARAM_TOOLTIPS: Record<string, string> = {
    [LAYER_PARAM_KEY.SHOW_VERTEX_IDS]: "Vertex IDs are visible only when the Select tool is active",
};
const NUMBER_PARAMS: Set<string> = new Set([LAYER_PARAM_KEY.Z_INDEX, LAYER_PARAM_KEY.POLYGON_EDGE_WIDTH]);
const COLOR_PARAMS: Set<string> = new Set([LAYER_PARAM_KEY.POLYGON_EDGE_COLOR, LAYER_PARAM_KEY.POLYGON_FILL_COLOR, LAYER_PARAM_KEY.GRID_LINE_COLOR]);

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
    const nonEmpty = sections.filter((s) => s.settings.some((p) => p.key !== LAYER_PARAM_KEY.VISIBLE));

    if (nonEmpty.length === 0) return null;

    return (
        <div className="border-t border-gray-100 bg-gray-50 py-1">
            {nonEmpty.map((section, idx) => {
                const visibleParams = section.settings.filter((p) => p.key !== LAYER_PARAM_KEY.VISIBLE);
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
