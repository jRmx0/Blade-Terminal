import { useState } from "react";
import type { LayerPK, LayerSettingParameter, LayerWithSettings } from "@/types/layerTypes";
import LayerSettingsPanel from "@/features/inspector/components/calc-layers-section/LayerSettingsPanel";
import type { SettingsSectionData } from "@/features/inspector/components/calc-layers-section/LayerSettingsPanel";

interface CompositeLayerRowProps {
    name: string;
    /** Members ordered top-to-bottom by Z-Index (highest Z first). */
    members: LayerWithSettings[];
    /** Settings from the group's dedicated ObjectGroup layer (e.g. "Show Vertex IDs"). */
    groupSettings: LayerSettingParameter[];
    onGroupParamChange: (name: string, value: string) => void;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onVisibilityChange: (pk: LayerPK, visible: boolean) => void;
    onParamChange: (layerKey: number, name: string, value: string) => void;
}

export default function CompositeLayerRow({
    name,
    members,
    groupSettings,
    onGroupParamChange,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    onVisibilityChange,
    onParamChange,
}: CompositeLayerRowProps) {
    const [expanded, setExpanded] = useState(false);

    const allVisible = members.every(
        (m) => m.settings.find((p) => p.name === "Visible")?.value === "true",
    );

    const sections = members.map((m) => ({
        label: m.layer.label,
        settings: m.settings,
        onParamChange: (paramName: string, value: string) =>
            onParamChange(m.layer.key, paramName, value),
    }));

    const groupSection: SettingsSectionData | null =
        groupSettings.length > 0
            ? { label: "", settings: groupSettings, onParamChange: onGroupParamChange }
            : null;

    return (
        <div>
            <div className="flex items-center gap-2 px-4 py-2">
                <input
                    type="checkbox"
                    checked={allVisible}
                    onChange={(e) => {
                        members.forEach((m) => onVisibilityChange({ id: m.layer.id, algorithmId: m.layer.algorithmId, providerId: m.layer.providerId }, e.target.checked));
                    }}
                    className="h-3.5 w-3.5 shrink-0 accent-teal-600 cursor-pointer"
                />
                <span className="flex-1 truncate text-sm text-gray-800">{name}</span>
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

            {expanded && (
                <>
                    {groupSection && (
                        <LayerSettingsPanel sections={[groupSection]} disabled={false} />
                    )}
                    <LayerSettingsPanel sections={sections} disabled={false} />
                </>
            )}
        </div>
    );
}
