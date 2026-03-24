import { useLayerSettingsStore } from "@/stores/layerSettingsStore";
import { LAYER_GROUPS } from "@/config/layers/layerRegistry";
import LayerRow from "@/features/inspector/components/calc-layers-section/LayerRow";
import CompositeLayerRow from "@/features/inspector/components/calc-layers-section/CompositeLayerRow";
import type { LayerPK, LayerSettingParameter, LayerWithSettings } from "@/types/layerTypes";

type DisplayItem =
    | { type: "single"; item: LayerWithSettings }
    | { type: "group"; groupId: string; name: string; members: LayerWithSettings[] };

function getFlatLayerDbIds(items: DisplayItem[]): LayerPK[] {
    return items.flatMap((item) =>
        item.type === "group"
            ? item.members.map((m) => ({ id: m.layer.id, algorithmId: m.layer.algorithmId, providerId: m.layer.providerId }))
            : [{ id: item.item.layer.id, algorithmId: item.item.layer.algorithmId, providerId: item.item.layer.providerId }],
    );
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
        const az = parseInt(a.settings.find((p) => p.name === "Z-Index")?.value ?? "0", 10);
        const bz = parseInt(b.settings.find((p) => p.name === "Z-Index")?.value ?? "0", 10);
        return bz - az;
    });

    // ── Pre-compute group-level settings (ObjectGroup layers) ─────────────────
    const groupSettingsMap = new Map<string, { settings: LayerSettingParameter[]; layerKey: number }>();
    for (const g of LAYER_GROUPS) {
        if (g.settingsLayerId !== undefined) {
            const sl = layers.find((l) => l.layer.key === g.settingsLayerId);
            if (sl) groupSettingsMap.set(g.id, { settings: sl.settings, layerKey: g.settingsLayerId });
        }
    }

    // Filter out ObjectGroup settings-owner layers — they surface only via their group row
    const displayableSorted = sorted.filter((item) => item.layer.type !== "ObjectGroup");

    // ── Build display items, collapsing grouped layers into one entry ─────────
    const groupByMemberKey = new Map<number, { groupId: string; name: string; memberIds: number[] }>();
    for (const g of LAYER_GROUPS) {
        for (const key of g.memberIds) {
            groupByMemberKey.set(key, { groupId: g.id, name: g.name, memberIds: g.memberIds });
        }
    }

    const seenGroupIds = new Set<string>();
    const displayItems: DisplayItem[] = [];

    for (const item of displayableSorted) {
        const group = groupByMemberKey.get(item.layer.key);
        if (group) {
            if (seenGroupIds.has(group.groupId)) continue;
            seenGroupIds.add(group.groupId);
            const members = sorted
                .filter((l) => group.memberIds.includes(l.layer.key))
                .sort((a, b) => {
                    const az = parseInt(a.settings.find((p) => p.name === "Z-Index")?.value ?? "0", 10);
                    const bz = parseInt(b.settings.find((p) => p.name === "Z-Index")?.value ?? "0", 10);
                    return bz - az;
                });
            displayItems.push({ type: "group", groupId: group.groupId, name: group.name, members });
        } else {
            displayItems.push({ type: "single", item });
        }
    }

    // ── Move handlers ─────────────────────────────────────────────────────────
    function handleMoveUp(displayIndex: number) {
        if (displayIndex <= 0 || displayIndex >= displayItems.length) return;
        const newItems = [...displayItems];
        [newItems[displayIndex - 1], newItems[displayIndex]] = [
            newItems[displayIndex]!,
            newItems[displayIndex - 1]!,
        ];
        reorderLayers(getFlatLayerDbIds(newItems));
    }

    function handleMoveDown(displayIndex: number) {
        if (displayIndex < 0 || displayIndex >= displayItems.length - 1) return;
        const newItems = [...displayItems];
        [newItems[displayIndex], newItems[displayIndex + 1]] = [
            newItems[displayIndex + 1]!,
            newItems[displayIndex]!,
        ];
        reorderLayers(getFlatLayerDbIds(newItems));
    }

    // ── Render ────────────────────────────────────────────────────────────────
    const orderedDisplay = displayItems;

    return (
        <div className="flex flex-col divide-y divide-gray-200">
            {orderedDisplay.map((displayItem, displayIndex) => {
                const isFirst = displayIndex === 0;
                const isLast = displayIndex === orderedDisplay.length - 1;

                if (displayItem.type === "group") {
                    const gData = groupSettingsMap.get(displayItem.groupId);
                    return (
                        <CompositeLayerRow
                            key={displayItem.groupId}
                            name={displayItem.name}
                            members={displayItem.members}
                            groupSettings={gData?.settings ?? []}
                            onGroupParamChange={(name, value) => {
                                if (gData) setParam(gData.layerKey, name, value);
                            }}
                            isFirst={isFirst}
                            isLast={isLast}
                            onMoveUp={() => handleMoveUp(displayIndex)}
                            onMoveDown={() => handleMoveDown(displayIndex)}
                            onVisibilityChange={(pk, visible) => setVisible(pk, visible)}
                            onParamChange={(layerKey, name, value) => setParam(layerKey, name, value)}
                        />
                    );
                }

                return (
                    <LayerRow
                        key={displayItem.item.layer.id}
                        layer={displayItem.item.layer}
                        settings={displayItem.item.settings}
                        isFirst={isFirst}
                        isLast={isLast}
                        onMoveUp={() => handleMoveUp(displayIndex)}
                        onMoveDown={() => handleMoveDown(displayIndex)}
                        onVisibilityChange={(visible) => setVisible({ id: displayItem.item.layer.id, algorithmId: displayItem.item.layer.algorithmId, providerId: displayItem.item.layer.providerId }, visible)}
                        onParamChange={(name, value) => setParam(displayItem.item.layer.key, name, value)}
                    />
                );
            })}
        </div>
    );
}
