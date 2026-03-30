import { useState } from "react";
import type { LayerSettingParameter } from "@/types/layerTypes";
import type { PointLabelColorEntry } from "@/types/serviceTypes";
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

/** Params intentionally hidden from the flat settings list (rendered via dedicated UI instead). */
const HIDDEN_PARAMS: Set<string> = new Set(["Point Label Enum Values"]);

// ─── Enum color helpers ───────────────────────────────────────────────────────
function parseEnumMapping(value: string): PointLabelColorEntry[] {
    if (!value) return [];
    try {
        const parsed: unknown = JSON.parse(value);
        if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            typeof (parsed[0] as { value?: unknown }).value === "string"
        ) {
            return parsed as PointLabelColorEntry[];
        }
    } catch { /* not JSON — fall through */ }
    // Fallback: old comma-separated labels with no colors yet
    return value.split(",").map((v) => ({ value: v.trim(), color: null })).filter((e) => e.value.length > 0);
}

// ─── Point Label Enum Colors collapsible group ────────────────────────────────
interface PointLabelEnumColorsGroupProps {
    param: LayerSettingParameter;
    disabled: boolean;
    onParamChange: (name: string, value: string) => void;
}

function PointLabelEnumColorsGroup({ param, disabled, onParamChange }: PointLabelEnumColorsGroupProps) {
    const [expanded, setExpanded] = useState(true);
    const entries = parseEnumMapping(param.value);

    if (entries.length === 0) return null;

    function handleColorChange(index: number, color: string) {
        const updated = entries.map((e, i) => (i === index ? { ...e, color } : e));
        onParamChange(param.key, JSON.stringify(updated));
    }

    return (
        <div>
            <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1 mt-0.5 text-left hover:bg-gray-100 transition-colors"
                onClick={() => setExpanded((prev) => !prev)}
            >
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider select-none whitespace-nowrap">
                    Point Label Enum Colors
                </span>
                <div className="flex-1 h-px bg-gray-200" />
                <span
                    className="material-symbols-outlined text-gray-400 shrink-0 transition-transform duration-150"
                    style={{ fontSize: 14, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                    expand_more
                </span>
            </button>
            {expanded && entries.map((entry, idx) => (
                <SettingsPanelRowColorInput
                    key={entry.value}
                    label={entry.value}
                    value={entry.color ?? ""}
                    disabled={disabled}
                    onChange={(v) => handleColorChange(idx, v)}
                />
            ))}
        </div>
    );
}

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
                const visibleParams = section.settings.filter(
                    (p) => p.key !== LAYER_PARAM_KEY.VISIBLE && !HIDDEN_PARAMS.has(p.key),
                );
                const enumParam = section.settings.find((p) => p.key === "Point Label Enum Values");
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
                        {enumParam != null && (
                            <PointLabelEnumColorsGroup
                                param={enumParam}
                                disabled={disabled}
                                onParamChange={section.onParamChange}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
