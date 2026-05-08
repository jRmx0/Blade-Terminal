import { useState, useMemo } from "react";
import {
    FloatingControl,
    FloatingControlNumberField,
    FloatingControlRangeField,
    FloatingControlTextField,
    FloatingControlButton,
    FloatingControlMainButton,
    parseRangeFieldValue,
} from "@/components/floating-control";
import { useCanvasGeneratorFloatingControlStore } from "@/features/canvas-editing/stores/canvasGeneratorFloatingControlStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { generateEnvironment, computeResolvedObstacleRatioPct, computeResolvedClusteringPct } from "@/features/canvas-editing/utils/canvasGenerator";
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
    const deletePoint = useEnvPointStore((s) => s.deletePoint);
    const envId = useEnvStore((s) => s.env.id);
    const uom = useUiUnitOfMeasureStore((s) => s.unitOfMeasure);

    const [width, setWidth] = useState("1000");
    const [height, setHeight] = useState("1000");
    const [minPassageWidth, setMinPassageWidth] = useState("30");
    const [obstacleRatio, setObstacleRatio] = useState("");
    const [clustering, setClustering] = useState("");
    const [seed, setSeed] = useState("");
    const [autoObstacleRatioHint, setAutoObstacleRatioHint] = useState<number | null>(null);
    const [autoClusteringHint, setAutoClusteringHint] = useState<number | null>(null);
    const [lastSeedHex, setLastSeedHex] = useState<string | null>(null);

    const uomLabel = unitLabel(uom);
    const widthLabel = uomLabel ? `Width (${uomLabel})` : "Width";
    const heightLabel = uomLabel ? `Height (${uomLabel})` : "Height";
    const minPassageWidthLabel = uomLabel ? `Min. passage width (${uomLabel})` : "Min. passage width";

    // Seed-derived previews; recomputed when seed or field value changes
    const seedDerivedObsRatio = useMemo(() => {
        const parsed = parseRangeFieldValue(obstacleRatio);
        const range = Array.isArray(parsed) ? parsed : undefined;
        return computeResolvedObstacleRatioPct(seed, range);
    }, [seed, obstacleRatio]);

    const seedDerivedClust = useMemo(() => {
        const parsed = parseRangeFieldValue(clustering);
        const range = Array.isArray(parsed) ? parsed : undefined;
        return computeResolvedClusteringPct(seed, range);
    }, [seed, clustering]);

    const obsIsAuto = obstacleRatio === "";
    const obsHintStr = seedDerivedObsRatio !== null
        ? String(seedDerivedObsRatio)
        : autoObstacleRatioHint !== null ? String(autoObstacleRatioHint) : "auto";
    // Blank → show auto hint as placeholder; filled range → show ~X pick preview in label
    const obsPlaceholder = obsIsAuto ? obsHintStr : undefined;
    const obsPreview = !obsIsAuto && seedDerivedObsRatio !== null ? `~${seedDerivedObsRatio}` : undefined;

    const clustIsAuto = clustering === "";
    const clustHintStr = seedDerivedClust !== null
        ? String(seedDerivedClust)
        : autoClusteringHint !== null ? String(autoClusteringHint) : "auto";
    const clustPlaceholder = clustIsAuto ? clustHintStr : undefined;
    const clustPreview = !clustIsAuto && seedDerivedClust !== null ? `~${seedDerivedClust}` : undefined;

    function handleClearEnvironment() {
        const snapshot = [...objects];
        snapshot.forEach((o) => deleteObject(o));
        deletePoint(envId, "start_end");
        deletePoint(envId, "start");
        deletePoint(envId, "end");
    }

    function handleGenerate() {
        const w = parseFloat(width);
        const h = parseFloat(height);
        const mpw = parseFloat(minPassageWidth);
        if (!isFinite(w) || w <= 0 || !isFinite(h) || h <= 0 || !isFinite(mpw) || mpw <= 0) return;

        const obRatio = parseRangeFieldValue(obstacleRatio);
        const clusteringVal = parseRangeFieldValue(clustering);

        const snapshot = [...objects];
        snapshot.forEach((o) => deleteObject(o));

        const env = generateEnvironment({ width: w, height: h, minPassageWidth: mpw, obstacleRatio: obRatio, clustering: clusteringVal, seed });

        // Update auto-hints so placeholders reflect the values actually used
        if (obRatio === undefined) setAutoObstacleRatioHint(env.usedObstacleRatioPct);
        if (clusteringVal === undefined) setAutoClusteringHint(env.usedClusteringPct);
        setLastSeedHex(env.usedSeedHex);

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
            <FloatingControlRangeField
                label="Obstacle ratio (%)"
                value={obstacleRatio}
                onChange={setObstacleRatio}
                min={0}
                max={100}
                placeholder={obsPlaceholder}
                preview={obsPreview}
            />
            <FloatingControlRangeField
                label="Clustering (%)"
                value={clustering}
                onChange={setClustering}
                min={0}
                max={100}
                placeholder={clustPlaceholder}
                preview={clustPreview}
            />
            <FloatingControlTextField
                label="Seed"
                value={seed}
                onChange={(v) => { setSeed(v); setLastSeedHex(null); }}
                placeholder={lastSeedHex ?? undefined}
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
