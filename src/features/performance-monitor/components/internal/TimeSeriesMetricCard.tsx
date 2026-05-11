import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    type ChartOptions,
    type Plugin,
} from "chart.js";
import { Line } from "react-chartjs-2";
import CardModalField from "@/components/modals/card-modal/CardModalField";
import type { PerformanceMetricStage } from "@/types/serviceTypes";
import {
    usePerformanceMonitorModalStore,
    DEFAULT_CHART_WIDTH,
    DEFAULT_CHART_HEIGHT,
} from "../../stores/performanceMonitorModalStore";
import { useChartResize } from "../../hooks/useChartResize";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const STAGE_COLORS = ["#ef4444", "#f59e0b", "#84cc16", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

const borderBoxPlugin: Plugin<"line"> = {
    id: "borderBox",
    afterDraw(chart) {
        const { ctx, chartArea: { left, top, right, bottom } } = chart;
        ctx.save();
        ctx.strokeStyle = "#9ca3af";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(right, top);
        ctx.lineTo(right, bottom);
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.stroke();
        ctx.restore();
    },
};

interface TimeSeriesMetricCardProps {
    metricId: number;
    name: string;
    data: number[];
    stages?: PerformanceMetricStage[];
    xAxisLabel?: string;
    yAxisLabel?: string;
}

export default function TimeSeriesMetricCard({ metricId, name, data, stages, xAxisLabel, yAxisLabel }: TimeSeriesMetricCardProps) {
    const chartRef = useRef<ChartJS<"line"> | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const effectiveTitleRef = useRef(name);
    const [isLabelEditorOpen, setIsLabelEditorOpen] = useState(false);
    const [titleOverride, setTitleOverride] = useState(name);
    const [xAxisLabelOverride, setXAxisLabelOverride] = useState(xAxisLabel ?? "Index");
    const [yAxisLabelOverride, setYAxisLabelOverride] = useState(yAxisLabel ?? "Value");

    useEffect(() => {
        setTitleOverride(name);
    }, [name]);

    useEffect(() => {
        setXAxisLabelOverride(xAxisLabel ?? "Index");
    }, [xAxisLabel]);

    useEffect(() => {
        setYAxisLabelOverride(yAxisLabel ?? "Value");
    }, [yAxisLabel]);

    const effectiveTitle = titleOverride.trim() || name;
    const effectiveXAxisLabel = xAxisLabelOverride.trim() || (xAxisLabel ?? "Index");
    const effectiveYAxisLabel = yAxisLabelOverride.trim() || (yAxisLabel ?? "Value");

    useEffect(() => {
        effectiveTitleRef.current = effectiveTitle;
    }, [effectiveTitle]);

    useEffect(() => {
        chartRef.current?.update();
    }, [effectiveTitle, effectiveXAxisLabel, effectiveYAxisLabel]);

    const min = useMemo(() => (data.length > 0 ? Math.min(...data) : null), [data]);
    const max = useMemo(() => (data.length > 0 ? Math.max(...data) : null), [data]);
    const showDots = data.length <= 20;

    const axisNumberFormatter = useMemo(
        () => new Intl.NumberFormat("fr-FR", { useGrouping: true, maximumFractionDigits: 20 }),
        [],
    );

    const formatAxisTick = useCallback(
        (value: string | number) => {
            const numericValue = typeof value === "number" ? value : Number(value);
            if (!Number.isFinite(numericValue)) return String(value);
            return axisNumberFormatter.format(numericValue).replace(/[\u00A0\u202F]/g, " ");
        },
        [axisNumberFormatter],
    );

    const normalizedStages = useMemo(
        () => (stages ?? [])
            .map((stage, index) => ({
                label: stage.label,
                sampleIndex: Math.max(0, Math.min(data.length - 1, Math.round(stage.sampleIndex))),
                color: STAGE_COLORS[index % STAGE_COLORS.length] ?? "#9ca3af",
            }))
            .sort((a, b) => a.sampleIndex - b.sampleIndex),
        [data.length, stages],
    );

    const titlePlugin = useMemo<Plugin<"line">>(
        () => ({
            id: `centerTitle-${metricId}`,
            beforeDraw(chart) {
                const { ctx, chartArea: { left, right, top } } = chart;
                ctx.save();
                ctx.fillStyle = "#374151";
                ctx.font = "bold 16px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                const maxWidth = right - left;
                let label = effectiveTitleRef.current;
                if (ctx.measureText(label).width > maxWidth) {
                    while (label.length > 0 && ctx.measureText(label + "…").width > maxWidth) {
                        label = label.slice(0, -1);
                    }
                    label += "…";
                }
                ctx.fillText(label, (left + right) / 2, top - 4);
                ctx.restore();
            },
        }),
        [metricId],
    );

    const stageMarkersPlugin = useMemo<Plugin<"line">>(
        () => ({
            id: `stageMarkers-${metricId}`,
            afterDatasetsDraw(chart) {
                if (normalizedStages.length === 0 || data.length === 0) return;

                const xScale = chart.scales.x as { getPixelForValue: (value: number) => number } | undefined;
                if (!xScale) return;

                const { ctx, chartArea: { left, right, top, bottom } } = chart;

                ctx.save();
                ctx.setLineDash([6, 4]);
                ctx.lineWidth = 2;

                for (const stage of normalizedStages) {
                    const x = xScale.getPixelForValue(stage.sampleIndex);
                    if (!Number.isFinite(x) || x < left || x > right) continue;

                    ctx.strokeStyle = stage.color;
                    ctx.beginPath();
                    ctx.moveTo(x, top);
                    ctx.lineTo(x, bottom);
                    ctx.stroke();
                }

                ctx.restore();
            },
        }),
        [data.length, metricId, normalizedStages],
    );

    const { chartSizes, setChartSize, persistChartSizes } = usePerformanceMonitorModalStore();
    const { width: chartWidth, height: chartHeight } =
        chartSizes[metricId] ?? { width: DEFAULT_CHART_WIDTH, height: DEFAULT_CHART_HEIGHT };

    const { handleResizePointerDown, isDragging } = useChartResize({ metricId, chartSizes, setChartSize, persistChartSizes, chartRef, containerRef });

    const handleDownload = useCallback(async () => {
        if (!chartRef.current) return;
        const src = chartRef.current.canvas;
        const dpr = window.devicePixelRatio || 1;

        const LEGEND_PAD_X = 12;
        const LEGEND_PAD_Y = 8;
        const SWATCH_W = 20;
        const SWATCH_GAP = 6;
        const ITEM_GAP = 16;
        const ROW_H = 20;
        const FONT = "bold 12px sans-serif";
        const EXPORT_PAD_X = 20;
        const EXPORT_PAD_Y = 20;
        const LEGEND_TOP_GAP = 8;

        const legendLayout = (() => {
            if (normalizedStages.length === 0) return null;

            const probe = document.createElement("canvas").getContext("2d");
            if (!probe) return null;

            probe.font = FONT;
            const maxRowContentWidth = Math.max(0, src.width / dpr - LEGEND_PAD_X * 2);

            const rows: Array<{
                items: Array<{ stage: (typeof normalizedStages)[number]; itemWidth: number }>;
                rowWidth: number;
            }> = [];

            let currentItems: Array<{ stage: (typeof normalizedStages)[number]; itemWidth: number }> = [];
            let currentRowWidth = 0;

            const flushRow = () => {
                if (currentItems.length === 0) return;
                rows.push({
                    items: currentItems,
                    rowWidth: Math.max(0, currentRowWidth - ITEM_GAP),
                });
                currentItems = [];
                currentRowWidth = 0;
            };

            for (const stage of normalizedStages) {
                const labelWidth = probe.measureText(stage.label).width;
                const itemWidth = SWATCH_W + SWATCH_GAP + labelWidth + ITEM_GAP;

                const projectedRowWidth = currentRowWidth === 0
                    ? itemWidth - ITEM_GAP
                    : currentRowWidth + itemWidth - ITEM_GAP;

                if (currentItems.length > 0 && projectedRowWidth > maxRowContentWidth) {
                    flushRow();
                }

                currentItems.push({ stage, itemWidth });
                currentRowWidth += itemWidth;
            }

            flushRow();
            if (rows.length === 0) return null;

            const contentWidth = Math.max(...rows.map((row) => row.rowWidth));
            const panelWidth = contentWidth + LEGEND_PAD_X * 2;
            const panelHeight = LEGEND_PAD_Y * 2 + rows.length * ROW_H;

            return { rows, contentWidth, panelWidth, panelHeight };
        })();

        const legendH = legendLayout ? LEGEND_TOP_GAP + legendLayout.panelHeight : 0;

        const offscreen = document.createElement("canvas");
        offscreen.width = src.width + Math.round(EXPORT_PAD_X * 2 * dpr);
        offscreen.height = src.height + Math.round((EXPORT_PAD_Y * 2 + legendH) * dpr);
        const ctx2d = offscreen.getContext("2d")!;
        ctx2d.fillStyle = "#ffffff";
        ctx2d.fillRect(0, 0, offscreen.width, offscreen.height);
        ctx2d.drawImage(src, Math.round(EXPORT_PAD_X * dpr), Math.round(EXPORT_PAD_Y * dpr));

        if (legendLayout) {
            ctx2d.save();
            ctx2d.scale(dpr, dpr);

            const chartH = src.height / dpr;
            const panelX = EXPORT_PAD_X + (src.width / dpr - legendLayout.panelWidth) / 2;
            const panelY = EXPORT_PAD_Y + chartH + LEGEND_TOP_GAP;
            const panelW = legendLayout.panelWidth;

            // Panel border
            ctx2d.strokeStyle = "#e5e7eb";
            ctx2d.lineWidth = 1;
            ctx2d.setLineDash([]);
            ctx2d.strokeRect(panelX, panelY, panelW, legendLayout.panelHeight);

            ctx2d.font = FONT;
            ctx2d.fillStyle = "#374151";
            ctx2d.textBaseline = "middle";

            let y = panelY + LEGEND_PAD_Y + ROW_H / 2;

            for (const row of legendLayout.rows) {
                let x = panelX + LEGEND_PAD_X + (legendLayout.contentWidth - row.rowWidth) / 2;

                for (const { stage, itemWidth } of row.items) {
                    // Dashed swatch
                    ctx2d.strokeStyle = stage.color;
                    ctx2d.lineWidth = 2;
                    ctx2d.setLineDash([4, 3]);
                    ctx2d.beginPath();
                    ctx2d.moveTo(x, y);
                    ctx2d.lineTo(x + SWATCH_W, y);
                    ctx2d.stroke();

                    // Label
                    ctx2d.setLineDash([]);
                    ctx2d.lineWidth = 1;
                    ctx2d.fillText(stage.label, x + SWATCH_W + SWATCH_GAP, y);

                    x += itemWidth;
                }

                y += ROW_H;
            }

            ctx2d.restore();
        }

        const blob = await new Promise<Blob>((resolve, reject) =>
            offscreen.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
        );
        let fileHandle: FileSystemFileHandle;
        try {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: `${effectiveTitle}.png`,
                types: [{ description: "PNG image", accept: { "image/png": [".png"] } }],
            });
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            console.error("[TimeSeriesMetricCard] showSaveFilePicker failed:", err);
            return;
        }
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (err) {
            console.error("[TimeSeriesMetricCard] File write failed:", err);
        }
    }, [chartRef, effectiveTitle, normalizedStages]);

    const handleCsvExport = useCallback(async () => {
        const header = `${effectiveXAxisLabel},${effectiveYAxisLabel}`;
        const rows = data.map((v, i) => `${i},${v}`);
        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        let fileHandle: FileSystemFileHandle;
        try {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: `${effectiveTitle}.csv`,
                types: [{ description: "CSV file", accept: { "text/csv": [".csv"] } }],
            });
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            console.error("[TimeSeriesMetricCard] showSaveFilePicker failed:", err);
            return;
        }
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (err) {
            console.error("[TimeSeriesMetricCard] CSV write failed:", err);
        }
    }, [data, effectiveTitle, effectiveXAxisLabel, effectiveYAxisLabel]);

    const chartData = useMemo(
        () => ({
            labels: data.map((_, i) => i),
            datasets: [
                {
                    data,
                    borderColor: "#0d9488",
                    borderWidth: 1.5,
                    pointRadius: showDots ? 2 : 0,
                    pointHoverRadius: 4,
                    pointBackgroundColor: "#0d9488",
                    tension: 0,
                },
            ],
        }),
        [data, showDots],
    );

    const options = useMemo<ChartOptions<"line">>(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            layout: { padding: { top: 22 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${effectiveXAxisLabel}: ${items[0]?.label ?? ""}`,
                        label: (item) => `${effectiveTitle}: ${item.raw}`,
                    },
                },
            },
            scales: {
                x: {
                    title: { display: true, text: effectiveXAxisLabel, font: { size: 14, weight: "bold" }, color: "#4b5563" },
                    ticks: {
                        font: { size: 14, weight: "bold" },
                        color: "#4b5563",
                        autoSkipPadding: 20,
                        maxRotation: 0,
                        callback: (value) => formatAxisTick(value),
                    },
                    grid: { color: "#e5e7eb" },
                    border: { color: "#9ca3af" },
                },
                y: {
                    title: { display: true, text: effectiveYAxisLabel, font: { size: 14, weight: "bold" }, color: "#4b5563" },
                    ticks: { font: { size: 14, weight: "bold" }, color: "#4b5563", callback: (value) => formatAxisTick(value) },
                    grid: { color: "#e5e7eb" },
                    border: { color: "#9ca3af" },
                },
            },
        }),
        [effectiveTitle, effectiveXAxisLabel, effectiveYAxisLabel, formatAxisTick],
    );

    return (
        <div className="px-4 py-3 border-b border-gray-200 last:border-b-0">
            <div className="relative mx-auto" ref={containerRef} style={{ width: chartWidth, height: chartHeight }}>
                <Line
                    ref={chartRef}
                    data={chartData}
                    options={options}
                    plugins={[borderBoxPlugin, titlePlugin, stageMarkersPlugin]}
                />
                <span
                    onClick={handleCsvExport}
                    title="Export CSV"
                    className="material-symbols-outlined absolute bottom-0 right-15 cursor-pointer select-none leading-none z-10 text-gray-300 hover:text-gray-600"
                    style={{ fontSize: 16 }}
                >
                    table_chart
                </span>
                <span
                    onClick={handleDownload}
                    title="Export PNG"
                    className="material-symbols-outlined absolute bottom-0 right-10 cursor-pointer select-none leading-none z-10 text-gray-300 hover:text-gray-600"
                    style={{ fontSize: 16 }}
                >
                    download
                </span>
                <span
                    onClick={() => setIsLabelEditorOpen((prev) => !prev)}
                    title="Edit labels"
                    className={`material-symbols-outlined absolute bottom-0 right-5 cursor-pointer select-none leading-none z-10 ${isLabelEditorOpen ? "text-gray-600" : "text-gray-300 hover:text-gray-600"}`}
                    style={{ fontSize: 16 }}
                >
                    edit_note
                </span>
                <span
                    onPointerDown={handleResizePointerDown}
                    title="Resize"
                    className={`material-symbols-outlined absolute bottom-0 right-0 cursor-se-resize select-none leading-none rotate-270 z-10 ${isDragging ? "text-gray-600" : "text-gray-300 hover:text-gray-600"}`}
                    style={{ fontSize: 16 }}
                >
                    resize_window
                </span>
            </div>
            {isLabelEditorOpen && (
                <div className="mx-auto mt-2 rounded border border-gray-200 bg-white px-3 py-2" style={{ width: chartWidth }}>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                            Title
                            <input
                                type="text"
                                value={titleOverride}
                                onChange={(e) => setTitleOverride(e.target.value)}
                                className="h-8 rounded border border-gray-300 px-2 text-xs text-gray-800 outline-none focus:border-teal-500"
                                placeholder={name}
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                            X axis label
                            <input
                                type="text"
                                value={xAxisLabelOverride}
                                onChange={(e) => setXAxisLabelOverride(e.target.value)}
                                className="h-8 rounded border border-gray-300 px-2 text-xs text-gray-800 outline-none focus:border-teal-500"
                                placeholder={xAxisLabel ?? "Index"}
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                            Y axis label
                            <input
                                type="text"
                                value={yAxisLabelOverride}
                                onChange={(e) => setYAxisLabelOverride(e.target.value)}
                                className="h-8 rounded border border-gray-300 px-2 text-xs text-gray-800 outline-none focus:border-teal-500"
                                placeholder={yAxisLabel ?? "Value"}
                            />
                        </label>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setTitleOverride(name);
                                setXAxisLabelOverride(xAxisLabel ?? "Index");
                                setYAxisLabelOverride(yAxisLabel ?? "Value");
                            }}
                            className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLabelEditorOpen(false)}
                            className="rounded border border-teal-600 bg-teal-600 px-2 py-1 text-xs font-semibold text-white hover:bg-teal-700"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
            {normalizedStages.length > 0 && (
                <div className="mx-auto mt-2 inline-flex w-fit flex-col items-center rounded border border-gray-200 px-3 py-2">
                    {/* <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Stage legend</div> */}
                    <div className="inline-flex w-fit flex-wrap justify-center gap-x-4 gap-y-1">
                        {normalizedStages.map((stage, index) => (
                            <div key={`${stage.label}-${stage.sampleIndex}-${index}`} className="flex items-center gap-2 text-xs text-gray-700">
                                <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderTopColor: stage.color }} />
                                <span className="font-medium">{stage.label}</span>
                                {/* <span className="text-gray-500">@ {stage.sampleIndex}</span> */}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-2 mt-2">
                <CardModalField id="min" label="Min" value={min !== null ? String(min) : "—"} disabled />
                <CardModalField id="max" label="Max" value={max !== null ? String(max) : "—"} disabled />
            </div>
        </div>
    );
}

