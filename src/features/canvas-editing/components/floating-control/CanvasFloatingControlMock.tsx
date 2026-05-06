import { useState } from "react";
import {
    FloatingControl,
    FloatingControlNumberField,
    FloatingControlTextField,
    FloatingControlButton,
    FloatingControlMainButton,
} from "@/components/floating-control";
import { useCanvasFloatingControlStore } from "@/features/canvas-editing/stores/canvasFloatingControlStore";

export default function CanvasFloatingControlMock() {
    const isOpen = useCanvasFloatingControlStore((state) => state.isOpen);
    const setOpen = useCanvasFloatingControlStore((state) => state.setOpen);

    const [name, setName] = useState("");
    const [width, setWidth] = useState("10");
    const [spacing, setSpacing] = useState("0.5");

    function handleReset() {
        setName("");
        setWidth("10");
        setSpacing("0.5");
    }

    function handleApply() {
        // Mock: no-op
    }

    return (
        <FloatingControl
            title="Canvas Control"
            isOpen={isOpen}
            onClose={() => setOpen(false)}
            defaultPosition={{ x: 16, y: 16 }}
        >
            <FloatingControlTextField
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Enter name"
            />
            <FloatingControlNumberField
                label="Width"
                value={width}
                onChange={setWidth}
                type="int"
                min={1}
                max={1000}
            />
            <FloatingControlNumberField
                label="Spacing"
                value={spacing}
                onChange={setSpacing}
                type="decimal"
                min={0.1}
                max={100}
                step={0.1}
            />
            <div className="mx-3 my-1 border-t border-gray-300" />
            <FloatingControlButton label="Reset" onClick={handleReset} />
            <FloatingControlMainButton label="Apply" onClick={handleApply} />
        </FloatingControl>
    );
}
