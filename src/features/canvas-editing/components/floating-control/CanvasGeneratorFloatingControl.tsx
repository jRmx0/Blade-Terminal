import { useState, useMemo, useEffect, useRef } from "react";
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
import { generateEnvironment, computeResolvedObstacleRatioPct, computeResolvedClusteringPct, validateCellSizeFit } from "@/features/canvas-editing/utils/canvasGenerator";
import { useUiUnitOfMeasureStore } from "@/features/ui-manager/stores/uiUnitOfMeasureStore";
import { useEnvPointStore } from "@/stores/envPointStore";
import { useEnvStore } from "@/stores/envStore";
import { OBJECT_CATEGORY, OBJECT_TYPE } from "@/config/db-ops/enums";
import { unitLabel } from "@/utils/unitOfMeasure";
import { getUiPreference, setUiPreference } from "@server/db/uiPreferences";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import { executeComputeRequest } from "@/features/coverage-planning/data/computeService";

const UI_PREF_KEY = "floatingControl.canvas-generator";

interface CanvasGeneratorFloatingControlPrefs {
    isOpen: boolean;
    position: { x: number; y: number };
    values: {
        width: string;
        height: string;
        minPassageWidth: string;
        obstacleRatio: string;
        clustering: string;
        seed: string;
        lastSeedHex: string | null;
    };
}

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
    const computeStatus = useComputeResultStore((s) => s.status);
    const isComputeBusy = computeStatus === "submitting" || computeStatus === "polling";

    const [width, setWidth] = useState("1000");
    const [height, setHeight] = useState("1000");
    const [minPassageWidth, setMinPassageWidth] = useState("30");
    const [obstacleRatio, setObstacleRatio] = useState("");
    const [clustering, setClustering] = useState("");
    const [seed, setSeed] = useState("");
    const [autoObstacleRatioHint, setAutoObstacleRatioHint] = useState<number | null>(null);
    const [autoClusteringHint, setAutoClusteringHint] = useState<number | null>(null);
    const [lastSeedHex, setLastSeedHex] = useState<string | null>(null);
    const [controlPosition, setControlPosition] = useState({ x: 16, y: 16 });
    const isHydratedRef = useRef(false);

    const uomLabel = unitLabel(uom);
    const widthLabel = uomLabel ? `Width (${uomLabel})` : "Width";
    const heightLabel = uomLabel ? `Height (${uomLabel})` : "Height";
    const cellSizeLabel = uomLabel ? `Cell size (${uomLabel})` : "Cell size";

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

    // Cell size fit validation: runs whenever width, height, or cell size changes
    const cellSizeFitError = useMemo(() => {
        const w = parseFloat(width);
        const h = parseFloat(height);
        const cs = parseFloat(minPassageWidth);
        return validateCellSizeFit(w, h, cs);
    }, [width, height, minPassageWidth]);

    useEffect(() => {
        let isCancelled = false;

        async function hydrate() {
            const fallback: CanvasGeneratorFloatingControlPrefs = {
                isOpen: false,
                position: { x: 16, y: 16 },
                values: {
                    width: "1000",
                    height: "1000",
                    minPassageWidth: "30",
                    obstacleRatio: "",
                    clustering: "",
                    seed: "",
                    lastSeedHex: null,
                },
            };

            const saved = await getUiPreference<CanvasGeneratorFloatingControlPrefs>(UI_PREF_KEY, fallback);
            if (isCancelled) return;

            setOpen(saved.isOpen);
            setControlPosition(saved.position);
            setWidth(saved.values.width);
            setHeight(saved.values.height);
            setMinPassageWidth(saved.values.minPassageWidth);
            setObstacleRatio(saved.values.obstacleRatio);
            setClustering(saved.values.clustering);
            setSeed(saved.values.seed);
            setLastSeedHex(saved.values.lastSeedHex);
            isHydratedRef.current = true;
        }

        void hydrate();
        return () => {
            isCancelled = true;
        };
    }, [setOpen]);

    useEffect(() => {
        if (!isHydratedRef.current) return;

        const timeoutId = setTimeout(() => {
            const payload: CanvasGeneratorFloatingControlPrefs = {
                isOpen,
                position: controlPosition,
                values: {
                    width,
                    height,
                    minPassageWidth,
                    obstacleRatio,
                    clustering,
                    seed,
                    lastSeedHex,
                },
            };
            void setUiPreference(UI_PREF_KEY, payload);
        }, 120);

        return () => clearTimeout(timeoutId);
    }, [
        isOpen,
        controlPosition,
        width,
        height,
        minPassageWidth,
        obstacleRatio,
        clustering,
        seed,
        lastSeedHex,
    ]);

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
        if (cellSizeFitError !== null) return;

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

    function handleGenerateAndRun() {
        if (cellSizeFitError !== null) return;
        handleGenerate();
        executeComputeRequest().then((result) => {
            if (!result.ok) {
                console.error("[GenerateAndRun] compute error:", result.error);
            }
        });
    }

    return (
        <FloatingControl
            id="canvas-generator"
            title="Generator"
            isOpen={isOpen}
            onClose={() => setOpen(false)}
            defaultPosition={controlPosition}
            onPositionChange={setControlPosition}
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
            <div className="flex items-center gap-2 px-3 h-8">
                <div className="w-29/50 shrink-0 flex items-center gap-1 min-w-0">
                    <span className="text-xs text-gray-500 truncate select-none">{cellSizeLabel}</span>
                    <span className="flex-1 min-w-0 h-1 bg-[radial-gradient(circle,#d1d5db_1.5px,transparent_1.5px)] bg-size-[10px_10px] bg-repeat-x bg-center" />
                    {cellSizeFitError && (
                        <span
                            className="shrink-0 flex items-center cursor-default transition-colors text-red-500 hover:text-red-600"
                            title={cellSizeFitError}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                        </span>
                    )}
                </div>
                <div className="relative flex-1 min-w-0">
                    <input
                        type="number"
                        value={minPassageWidth}
                        onChange={(e) => setMinPassageWidth(e.target.value)}
                        step={1}
                        min={0}
                        placeholder=""
                        className="w-full border rounded bg-white text-xs px-2 h-6 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-gray-400 placeholder:italic border-gray-300 text-gray-900"
                    />
                </div>
            </div>
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
            <FloatingControlButton
                label="Generate"
                onClick={handleGenerate}
                disabled={cellSizeFitError !== null}
            />
            <FloatingControlMainButton
                label="Generate and Run"
                onClick={handleGenerateAndRun}
                disabled={isComputeBusy || cellSizeFitError !== null}
            />
        </FloatingControl>
    );
}
