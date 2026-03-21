import { useLayerSettingsStore } from "@/stores/layerSettingsStore";
import LayerRow from "@/features/inspector/components/calc-layers-section/LayerRow";

export default function LayersTab() {
    const layers = useLayerSettingsStore((s) => s.layers);
    const setVisible = useLayerSettingsStore((s) => s.setVisible);
    const setParam = useLayerSettingsStore((s) => s.setParam);
    const swapZIndex = useLayerSettingsStore((s) => s.swapZIndex);

    if (layers.length === 0) {
        return (
            <div className="px-4 py-3 text-xs text-gray-400">
                No layers found. Clear IndexedDB to reload defaults.
            </div>
        );
    }

    const movable = layers.filter((item) => !item.layer.placeholder);
    const placeholders = layers.filter((item) => item.layer.placeholder === true);

    movable.sort((a, b) => {
        const az = parseInt(a.settings.find((p) => p.name === "Z-Index")?.value ?? "0", 10);
        const bz = parseInt(b.settings.find((p) => p.name === "Z-Index")?.value ?? "0", 10);
        return bz - az;
    });
    placeholders.sort((a, b) => {
        const az = parseInt(a.settings.find((p) => p.name === "Z-Index")?.value ?? "0", 10);
        const bz = parseInt(b.settings.find((p) => p.name === "Z-Index")?.value ?? "0", 10);
        return bz - az;
    });

    const orderedLayers = [...movable, ...placeholders];

    function handleMoveUp(index: number) {
        const current = orderedLayers[index];
        const target = orderedLayers[index - 1];
        if (!current || !target || current.layer.placeholder || target.layer.placeholder) return;
        swapZIndex(current.layer.id!, target.layer.id!);
    }

    function handleMoveDown(index: number) {
        const current = orderedLayers[index];
        const target = orderedLayers[index + 1];
        if (!current || !target || current.layer.placeholder || target.layer.placeholder) return;
        swapZIndex(current.layer.id!, target.layer.id!);
    }

    return (
        <div className="flex flex-col divide-y divide-gray-200">
            {orderedLayers.map(({ layer, settings }, index) => (
                <LayerRow
                    key={layer.id}
                    layer={layer}
                    settings={settings}
                    isFirst={index === 0}
                    isLast={index === movable.length - 1 || layer.placeholder === true}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    onVisibilityChange={(visible) => setVisible(layer.id!, visible)}
                    onParamChange={(name, value) => setParam(layer.key, name, value)}
                />
            ))}
        </div>
    );
}
