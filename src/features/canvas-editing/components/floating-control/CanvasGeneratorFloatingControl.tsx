import { useState } from "react";
import {
    FloatingControl,
    FloatingControlNumberField,
    FloatingControlTextField,
    FloatingControlButton,
    FloatingControlMainButton,
} from "@/components/floating-control";
import { useCanvasGeneratorFloatingControlStore } from "@/features/canvas-editing/stores/canvasGeneratorFloatingControlStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useUiUnitOfMeasureStore } from "@/features/ui-manager/stores/uiUnitOfMeasureStore";
import { unitLabel } from "@/utils/unitOfMeasure";

export default function CanvasGeneratorFloatingControl() {
    const isOpen = useCanvasGeneratorFloatingControlStore((s) => s.isOpen);
    const setOpen = useCanvasGeneratorFloatingControlStore((s) => s.setOpen);

    const objects = useCanvasObjectStore((s) => s.objects);
    const deleteObject = useCanvasObjectStore((s) => s.deleteObject);
    const uom = useUiUnitOfMeasureStore((s) => s.unitOfMeasure);

    const [vertexCount, setVertexCount] = useState("250");
    const [width, setWidth] = useState("1000");
    const [height, setHeight] = useState("1000");
    const [seed, setSeed] = useState("");

    const uomLabel = unitLabel(uom);
    const widthLabel = uomLabel ? `Width (${uomLabel})` : "Width";
    const heightLabel = uomLabel ? `Height (${uomLabel})` : "Height";

    function handleClearEnvironment() {
        const snapshot = [...objects];
        snapshot.forEach((o) => deleteObject(o));
    }

    function handleGenerate() {
        // TODO: implement generation logic
    }

    return (
        <FloatingControl
            title="Generator"
            isOpen={isOpen}
            onClose={() => setOpen(false)}
            defaultPosition={{ x: 16, y: 16 }}
        >
            <FloatingControlNumberField
                label="Vertex Count"
                value={vertexCount}
                onChange={setVertexCount}
                type="int"
                min={3}
                step={1}
            />
            <FloatingControlNumberField
                label={widthLabel}
                value={width}
                onChange={setWidth}
                type="decimal"
                min={0}
                step={1}
            />
            <FloatingControlNumberField
                label={heightLabel}
                value={height}
                onChange={setHeight}
                type="decimal"
                min={0}
                step={1}
            />
            <FloatingControlTextField
                label="Seed"
                value={seed}
                onChange={setSeed}
            />
            <div className="mx-3 my-1 border-t border-gray-300" />
            <FloatingControlButton
                label="Clear Environment"
                onClick={handleClearEnvironment}
            />
            <FloatingControlMainButton
                label="Generate"
                onClick={handleGenerate}
            />
        </FloatingControl>
    );
}
