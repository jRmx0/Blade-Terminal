import { useCanvasViewStore } from "@/features/canvas-editing/stores/canvasViewStore";
import { GRID_SPACING, pickGridLevel } from "@/config/canvas-editing/canvasConfig";

export default function CanvasGridScale() {
    const scale = useCanvasViewStore((s) => s.scale);
    const level = pickGridLevel(scale);
    const cellWorld = GRID_SPACING * level;
    const cellPx = Math.round(GRID_SPACING * level * scale);

    return (
        <div className="flex items-center gap-1.5 h-5 px-1.5 text-xs text-gray-500 select-none tabular-nums">
            <span>{cellWorld} px</span>
            <div className="flex items-end">
                <div className="w-px h-2 bg-gray-400" />
                <div className="border-t border-gray-400" style={{ width: cellPx }} />
                <div className="w-px h-2 bg-gray-400" />
            </div>
        </div>
    );
}
