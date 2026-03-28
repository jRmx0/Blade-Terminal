import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID } from "@/config/layers/layerRegistry";
import type { ObjectCategory } from "@/config/db-ops/enums";

interface PolygonLayerStyle {
    /** Whether the layer is currently set to visible. */
    visible: boolean;
    /** Polygon edge / accent color. */
    stroke: string;
    /** Polygon fill color. */
    fill: string;
    /** Polygon edge width in world-space pixels. */
    edgeWidth: number;
    /** Whether vertex index labels should be shown. */
    showVertexIds: boolean;
}

const DEFAULTS = {
    zone: { stroke: "#22c55e", fill: "#22c55e2e" },
    obstacle: { stroke: "#ef4444", fill: "#ef44443b" },
} as const;

/**
 * Reads all style parameters for the given polygon category from layerSettingsStore.
 * Centralises the repeated getLayerParam calls that previously appeared in every
 * canvas layer component.
 */
export function usePolygonLayerStyle(category: ObjectCategory): PolygonLayerStyle {
    const layers = useLayerSettingsStore((s) => s.layers);
    const layerId = category === "zone" ? LAYER_ID.ZONES : LAYER_ID.OBSTACLES;
    const def = DEFAULTS[category as keyof typeof DEFAULTS] ?? DEFAULTS.zone;
    return {
        visible: getLayerParam(layers, layerId, "Visible") !== "false",
        stroke: getLayerParam(layers, layerId, "Polygon Edge Color") ?? def.stroke,
        fill: getLayerParam(layers, layerId, "Polygon Fill Color") ?? def.fill,
        edgeWidth: parseFloat(getLayerParam(layers, layerId, "Polygon Edge Width") ?? "1.5"),
        showVertexIds: getLayerParam(layers, layerId, "Show Vertex IDs") !== "false",
    };
}
