import { useState } from "react";
import type { LayerRecord, LayerSettingParameter } from "@/types/layerTypes";
import LayerSettingsPanel from "@/features/inspector/components/calc-layers-section/LayerSettingsPanel";

interface LayerRowProps {
    layer: LayerRecord;
    settings: LayerSettingParameter[];
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onVisibilityChange: (visible: boolean) => void;
    onParamChange: (name: string, value: string) => void;
}

export default function LayerRow({
    layer,
    settings,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    onVisibilityChange,
    onParamChange,
}: LayerRowProps) {
    const [expanded, setExpanded] = useState(false);

    const disabled = layer.placeholder === true;
    const visible = settings.find((p) => p.name === "Visible")?.value === "true";

    return (
        <div className={disabled ? "opacity-50" : ""}>
            {/* Row: visibility + name + controls */}
            <div className="flex items-center gap-2 px-4 py-2">
                <input
                    type="checkbox"
                    checked={visible}
                    disabled={disabled}
                    onChange={(e) => onVisibilityChange(e.target.checked)}
                    className="h-3.5 w-3.5 shrink-0 accent-teal-600 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="flex-1 truncate text-sm text-gray-800" title={layer.label}>
                    {layer.label}
                    {disabled && (
                        <span className="ml-1 text-xs text-gray-400">(placeholder)</span>
                    )}
                </span>
                {/* Z-order controls */}
                <div className="flex shrink-0 gap-0.5">
                    <button
                        type="button"
                        disabled={disabled || isFirst}
                        onClick={onMoveUp}
                        title="Move layer up"
                        className="flex items-center justify-center rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            arrow_upward
                        </span>
                    </button>
                    <button
                        type="button"
                        disabled={disabled || isLast}
                        onClick={onMoveDown}
                        title="Move layer down"
                        className="flex items-center justify-center rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            arrow_downward
                        </span>
                    </button>
                </div>
                {/* Expand / collapse settings */}
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setExpanded((prev) => !prev)}
                    title={expanded ? "Collapse settings" : "Expand settings"}
                    className="flex items-center justify-center rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <span
                        className="material-symbols-outlined transition-transform duration-150"
                        style={{ fontSize: 14, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                        expand_more
                    </span>
                </button>
            </div>

            {/* Settings panel */}
            {expanded && (
                <LayerSettingsPanel
                    settings={settings}
                    disabled={disabled}
                    onParamChange={onParamChange}
                />
            )}
        </div>
    );
}
