import { useEffect, useState } from "react";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useEnvPointStore } from "@/stores/envPointStore";
import { useEnvStore } from "@/stores/envStore";

function CoordInput({
    label,
    value,
    onCommit,
}: {
    label: string;
    value: number;
    onCommit: (v: number) => void;
}) {
    const [local, setLocal] = useState(value.toFixed(2));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) setLocal(value.toFixed(2));
    }, [value, isFocused]);

    const isFloated = local !== "" || isFocused;

    function commit() {
        const parsed = parseFloat(local);
        if (!isNaN(parsed) && parsed !== value) {
            onCommit(parsed);
        }
    }

    return (
        <div className="relative flex-1 min-w-0">
            <span
                className={`absolute pointer-events-none select-none transition-all duration-150 leading-none ${isFloated
                    ? `top-1 left-2 text-xs ${isFocused ? "text-teal-700" : "text-gray-500"}`
                    : "top-1/2 -translate-y-1/2 left-2 text-sm text-gray-400"
                    }`}
            >
                {label}
            </span>
            <input
                type="number"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setIsFocused(false);
                    commit();
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                }}
                className={`w-full rounded border bg-white text-sm px-2 pt-4 pb-1 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-gray-900 ${isFocused ? "border-teal-700" : "border-gray-300"
                    }`}
            />
        </div>
    );
}

export default function PointPositionField() {
    const selectedEnvPointType = useCanvasSelectionStore((s) => s.selectedEnvPointType);
    const startPoint = useEnvPointStore((s) => s.startPoint);
    const endPoint = useEnvPointStore((s) => s.endPoint);
    const startEndPoint = useEnvPointStore((s) => s.startEndPoint);
    const upsertPoint = useEnvPointStore((s) => s.upsertPoint);
    const envId = useEnvStore((s) => s.env.id);

    if (!selectedEnvPointType) return null;

    const currentPoint =
        selectedEnvPointType === "start"
            ? startPoint
            : selectedEnvPointType === "end"
                ? endPoint
                : startEndPoint;
    if (!currentPoint) return null;

    const { x, y } = currentPoint.point;

    function commitX(newX: number) {
        upsertPoint(envId, selectedEnvPointType!, { x: newX, y });
    }

    function commitY(newY: number) {
        upsertPoint(envId, selectedEnvPointType!, { x, y: newY });
    }

    return (
        <div className="flex items-center gap-2 px-5 py-1">
            <span className="w-[30%] shrink-0 truncate text-sm text-gray-800">Position</span>
            <div className="flex-1 min-w-0 flex gap-1.5">
                <CoordInput label="X" value={x} onCommit={commitX} />
                <CoordInput label="Y" value={y} onCommit={commitY} />
            </div>
        </div>
    );
}
