import { useCanvasDrawingStore } from "@/features/canvas-editing/stores/canvasDrawingStore";

export default function CanvasPointerPosition() {
    const pointerPos = useCanvasDrawingStore((s) => s.pointerPos);

    return (
        <div className="flex items-center gap-1 h-5 px-1.5 text-xs text-gray-500 select-none tabular-nums w-28 justify-end">
            <span className="material-symbols-outlined text-gray-400 shrink-0" style={{ fontSize: 14 }}>
                near_me
            </span>
            <span>
                {pointerPos
                    ? `${Math.round(pointerPos.x)}, ${Math.round(pointerPos.y)}px`
                    : "—"}
            </span>
        </div>
    );
}
