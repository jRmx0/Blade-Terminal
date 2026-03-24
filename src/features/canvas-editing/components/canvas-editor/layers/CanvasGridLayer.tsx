import { GRID_SPACING } from "@/config/canvas-editing/canvasConfig";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID } from "@/config/layers/layerRegistry";
import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";

/**
 * Renders the canvas grid as a CSS background-image rather than as Konva shapes.
 * This means the grid covers the full viewport at all times (no blank edges during
 * CSS-translate panning) and updating it on every pan frame is essentially free
 * (just a background-position style write — no canvas redraw).
 */
export function CanvasGridLayer() {
    const layers = useLayerSettingsStore((s) => s.layers);
    const gridVisible = getLayerParam(layers, LAYER_ID.GRID, "Visible") !== "false";
    const strokeColor = getLayerParam(layers, LAYER_ID.GRID, "Grid Line Color") ?? "#e2e8f0";
    const position = useCanvasViewStore((s) => s.position);
    const scale = useCanvasViewStore((s) => s.scale);

    if (!gridVisible) return null;

    const cellPx = GRID_SPACING * scale;
    const bgX = ((position.x % cellPx) + cellPx) % cellPx;
    const bgY = ((position.y % cellPx) + cellPx) % cellPx;

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(${strokeColor} 1px, transparent 1px), linear-gradient(90deg, ${strokeColor} 1px, transparent 1px)`,
                backgroundSize: `${cellPx}px ${cellPx}px`,
                backgroundPosition: `${bgX}px ${bgY}px`,
            }}
        />
    );
}
