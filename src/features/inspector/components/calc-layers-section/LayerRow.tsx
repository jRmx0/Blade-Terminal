import { useState } from "react";
import type { LayerRecord, LayerSettingParameter } from "@/types/layerTypes";
import { LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
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

    const visible = settings.find((p) => p.key === LAYER_PARAM_KEY.VISIBLE)?.value === "true";

    return (
        <div>
            {/* Row: visibility + name + controls */}
            <div className="flex items-center gap-2 px-4 py-2">
                <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => onVisibilityChange(e.target.checked)}
                    className="h-3.5 w-3.5 shrink-0 accent-teal-600 cursor-pointer"
                />
                <span className="flex-1 truncate text-sm text-gray-800" title={layer.label}>
                    {layer.label}
                </span>
                {/* Z-order controls */}
                <div className="flex shrink-0 gap-0.5">
                    <button
                        type="button"
                        disabled={isFirst}
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
                        disabled={isLast}
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
                    onClick={() => setExpanded((prev) => !prev)}
                    title={expanded ? "Collapse settings" : "Expand settings"}
                    className="flex items-center justify-center rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
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
                    sections={[{ label: layer.label, settings, onParamChange }]}
                />
            )}
        </div>
    );
}
