import { useLayerSettingsStore } from "@/stores/layerSettingsStore";
import { LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
import LayerRow from "@/features/inspector/components/calc-layers-section/LayerRow";
import type { LayerPK } from "@/types/layerTypes";

function toLayerPK(layer: { id: number; algorithmId: number; providerId: number }): LayerPK {
    return { id: layer.id, algorithmId: layer.algorithmId, providerId: layer.providerId };
}

export default function LayersTab() {
    const layers = useLayerSettingsStore((s) => s.layers);
    const setVisible = useLayerSettingsStore((s) => s.setVisible);
    const setParam = useLayerSettingsStore((s) => s.setParam);
    const reorderLayers = useLayerSettingsStore((s) => s.reorderLayers);

    if (layers.length === 0) {
        return (
            <div className="px-4 py-3 text-xs text-gray-400">
                No layers found. Clear IndexedDB to reload defaults.
            </div>
        );
    }

    // ── Sort all layers by Z-Index descending ────────────────────────────────
    const sorted = [...layers].sort((a, b) => {
        const az = parseInt(a.settings.find((p) => p.key === LAYER_PARAM_KEY.Z_INDEX)?.value ?? "0", 10);
        const bz = parseInt(b.settings.find((p) => p.key === LAYER_PARAM_KEY.Z_INDEX)?.value ?? "0", 10);
        return bz - az;
    });

    const movable = sorted.filter((item) => !item.layer.placeholder);
    const placeholders = sorted.filter((item) => item.layer.placeholder === true);
    const ordered = [...movable, ...placeholders];

    // ── Move handlers ─────────────────────────────────────────────────────────
    function handleMoveUp(movableIndex: number) {
        if (movableIndex <= 0) return;
        const next = [...movable];
        [next[movableIndex - 1], next[movableIndex]] = [next[movableIndex]!, next[movableIndex - 1]!];
        reorderLayers([...next.map((l) => toLayerPK(l.layer)), ...placeholders.map((l) => toLayerPK(l.layer))]);
    }

    function handleMoveDown(movableIndex: number) {
        if (movableIndex >= movable.length - 1) return;
        const next = [...movable];
        [next[movableIndex], next[movableIndex + 1]] = [next[movableIndex + 1]!, next[movableIndex]!];
        reorderLayers([...next.map((l) => toLayerPK(l.layer)), ...placeholders.map((l) => toLayerPK(l.layer))]);
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col divide-y divide-gray-200">
            {ordered.map((item) => {
                const movableIdx = movable.indexOf(item);
                const isFirst = movableIdx === 0;
                const isLast = item.layer.placeholder === true || movableIdx === movable.length - 1;

                return (
                    <LayerRow
                        key={`${item.layer.id}-${item.layer.algorithmId}-${item.layer.providerId}`}
                        layer={item.layer}
                        settings={item.settings}
                        isFirst={isFirst}
                        isLast={isLast}
                        onMoveUp={() => handleMoveUp(movableIdx)}
                        onMoveDown={() => handleMoveDown(movableIdx)}
                        onVisibilityChange={(visible) => setVisible(toLayerPK(item.layer), visible)}
                        onParamChange={(name, value) => setParam(item.layer.key, name, value)}
                    />
                );
            })}
        </div>
    );
}
