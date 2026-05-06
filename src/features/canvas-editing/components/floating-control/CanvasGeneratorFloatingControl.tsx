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
import { generateEnvironment } from "@/features/canvas-editing/utils/canvasGenerator";
import { useUiUnitOfMeasureStore } from "@/features/ui-manager/stores/uiUnitOfMeasureStore";
import { useEnvPointStore } from "@/stores/envPointStore";
import { useEnvStore } from "@/stores/envStore";
import { OBJECT_CATEGORY, OBJECT_TYPE } from "@/config/db-ops/enums";
import { unitLabel } from "@/utils/unitOfMeasure";

export default function CanvasGeneratorFloatingControl() {
    const isOpen = useCanvasGeneratorFloatingControlStore((s) => s.isOpen);
    const setOpen = useCanvasGeneratorFloatingControlStore((s) => s.setOpen);

    const objects = useCanvasObjectStore((s) => s.objects);
    const deleteObject = useCanvasObjectStore((s) => s.deleteObject);
    const addObject = useCanvasObjectStore((s) => s.addObject);
    const upsertPoint = useEnvPointStore((s) => s.upsertPoint);
    const envId = useEnvStore((s) => s.env.id);
    const uom = useUiUnitOfMeasureStore((s) => s.unitOfMeasure);

    const [width, setWidth] = useState("1000");
    const [height, setHeight] = useState("1000");
    const [minPassageWidth, setMinPassageWidth] = useState("30");
    const [obstacleRatio, setObstacleRatio] = useState("");
    const [seed, setSeed] = useState("");

    const uomLabel = unitLabel(uom);
    const widthLabel = uomLabel ? `Width (${uomLabel})` : "Width";
    const heightLabel = uomLabel ? `Height (${uomLabel})` : "Height";
    const minPassageWidthLabel = uomLabel ? `Min. passage width (${uomLabel})` : "Min. passage width";

    function handleClearEnvironment() {
        const snapshot = [...objects];
        snapshot.forEach((o) => deleteObject(o));
    }

    function handleGenerate() {
        const w = parseFloat(width);
        const h = parseFloat(height);
        const mpw = parseFloat(minPassageWidth);
        if (!isFinite(w) || w <= 0 || !isFinite(h) || h <= 0 || !isFinite(mpw) || mpw <= 0) return;

        const parsedRatio = parseFloat(obstacleRatio);
        const obRatio = isFinite(parsedRatio) ? parsedRatio : undefined;

        const snapshot = [...objects];
        snapshot.forEach((o) => deleteObject(o));

        const env = generateEnvironment({ width: w, height: h, minPassageWidth: mpw, obstacleRatio: obRatio, seed });
        addObject(OBJECT_CATEGORY.ZONE, env.boundary, OBJECT_TYPE.EMPTY);
        for (const obs of env.obstacles) {
            addObject(OBJECT_CATEGORY.OBSTACLE, obs, OBJECT_TYPE.EMPTY);
        }
        upsertPoint(envId, "start_end", env.startEndPoint);
    }

    return (
        <FloatingControl
            id="canvas-generator"
            title="Generator"
            isOpen={isOpen}
            onClose={() => setOpen(false)}
            defaultPosition={{ x: 16, y: 16 }}
        >
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
            <FloatingControlNumberField
                label={minPassageWidthLabel}
                value={minPassageWidth}
                onChange={setMinPassageWidth}
                type="decimal"
                min={0}
                step={1}
            />
            <FloatingControlNumberField
                label="Obstacle ratio (%)"
                value={obstacleRatio}
                onChange={setObstacleRatio}
                type="decimal"
                min={0}
                max={100}
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
