import type { LayerRecord, LayerSettingParameter, LayerType } from "@/types/layerTypes";

/** Returns the name of the primary color attribute for a layer type, or undefined if it has none. */
function primaryColorParam(type: LayerType | undefined): string | undefined {
    if (type === "Polygon") return "Polygon Edge Color";
    if (type === "Grid") return "Grid Line Color";
    return undefined;
}

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
    const disabled = layer.placeholder === true;
    const visible = settings.find((p) => p.name === "Visible")?.value === "true";
    const colorParamName = primaryColorParam(layer.type);
    const primaryColor = colorParamName ? settings.find((p) => p.name === colorParamName)?.value : undefined;

    return (
        <div className={`px-4 py-2 ${disabled ? "opacity-50" : ""}`}>
            {/* Row 1: visibility + name */}
            <div className="flex items-center gap-2">
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
                {primaryColor && colorParamName && (
                    <input
                        type="color"
                        value={primaryColor}
                        disabled={disabled}
                        onChange={(e) => onParamChange(colorParamName, e.target.value)}
                        className="h-4 w-4 shrink-0 cursor-pointer rounded border-none bg-transparent p-0 disabled:cursor-not-allowed"
                        title={colorParamName}
                    />
                )}
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
            </div>

        </div>
    );
}
