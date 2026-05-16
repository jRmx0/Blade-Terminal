import { useEffect, useRef, useState } from "react";
import { useFloatingControlZStore } from "@/components/floating-control/floatingControlZStore";
import { useCppDebugStore } from "@/features/coverage-planning/stores/cppDebugStore";

const CONTROL_ID = "cpp-debug";

export default function CppDebugFloatingControl() {
    const containerRef = useRef<HTMLDivElement>(null);

    const isOpen = useCppDebugStore((s) => s.isOpen);
    const controlPosition = useCppDebugStore((s) => s.controlPosition);
    const setControlPosition = useCppDebugStore((s) => s.setControlPosition);
    const stopDebug = useCppDebugStore((s) => s.stopDebug);

    const [pos, setPos] = useState(controlPosition);

    const register = useFloatingControlZStore((s) => s.register);
    const bringToFront = useFloatingControlZStore((s) => s.bringToFront);
    const zIndex = useFloatingControlZStore((s) => s.getZIndex(CONTROL_ID));

    useEffect(() => { register(CONTROL_ID); }, [register]);

    // Sync position from store when it changes externally
    useEffect(() => {
        setPos(controlPosition);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controlPosition.x, controlPosition.y]);

    // Persist position to store on drag
    useEffect(() => {
        setControlPosition(pos);
    }, [setControlPosition, pos]);

    function clampPos(x: number, y: number, parentW: number, parentH: number): { x: number; y: number } {
        const el = containerRef.current;
        const elW = el ? el.offsetWidth : 180;
        const elH = el ? el.offsetHeight : 40;
        return {
            x: Math.max(0, Math.min(x, parentW - elW)),
            y: Math.max(0, Math.min(y, parentH - elH)),
        };
    }

    // Clamp position when parent resizes
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const parent = el.offsetParent as HTMLElement | null;
        if (!parent) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setPos((prev) => clampPos(prev.x, prev.y, width, height));
            }
        });

        observer.observe(parent);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    function handleDragMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startPosX = pos.x;
        const startPosY = pos.y;

        const parent = containerRef.current?.offsetParent as HTMLElement | null;
        const parentRect = parent?.getBoundingClientRect() ?? { width: 0, height: 0 };

        function onMouseMove(ev: MouseEvent) {
            const rawX = startPosX + (ev.clientX - startMouseX);
            const rawY = startPosY + (ev.clientY - startMouseY);
            setPos(clampPos(rawX, rawY, parentRect.width, parentRect.height));
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    if (!isOpen) {
        return (
            <div
                ref={containerRef}
                className="absolute pointer-events-none"
                style={{ left: 0, top: 0, width: 0, height: 0 }}
                aria-hidden
            />
        );
    }

    return (
        <div
            ref={containerRef}
            className="absolute flex items-center px-0.5 py-0.5 bg-gray-100 border border-gray-300 rounded shadow-md select-none"
            style={{ left: pos.x, top: pos.y, zIndex }}
            onMouseDown={() => bringToFront(CONTROL_ID)}
            onKeyDown={(e) => e.stopPropagation()}
        >
            {/* Drag handle — only interactive element for moving */}
            <div
                className="flex items-center justify-center w-7 h-8 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 hover:bg-gray-200 rounded-l transition-colors"
                onMouseDown={handleDragMouseDown}
                title="Move"
            >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    drag_indicator
                </span>
            </div>

            {/* Separator */}
            <div className="mx-0.5 w-px h-6 bg-gray-300 shrink-0" />

            {/* Action buttons */}
            <div className="flex items-center gap-0.5">
                {/* Step Over */}
                <button
                    type="button"
                    title="Step Over"
                    onClick={() => { }}
                    className="flex items-center justify-center w-8 h-8 rounded text-sky-500 hover:text-sky-700 hover:bg-gray-200 active:bg-gray-300 cursor-pointer transition-colors focus:outline-none"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        step_over
                    </span>
                </button>

                {/* Restart */}
                <button
                    type="button"
                    title="Restart"
                    onClick={() => { }}
                    className="flex items-center justify-center w-8 h-8 rounded text-emerald-500 hover:text-emerald-700 hover:bg-gray-200 active:bg-gray-300 cursor-pointer transition-colors focus:outline-none"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        restart_alt
                    </span>
                </button>

                {/* Stop */}
                <button
                    type="button"
                    title="Stop"
                    onClick={stopDebug}
                    className="flex items-center justify-center w-8 h-8 rounded text-red-500 hover:text-red-700 hover:bg-red-100 active:bg-red-200 cursor-pointer transition-colors focus:outline-none"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        stop
                    </span>
                </button>
            </div>
        </div>
    );
}
