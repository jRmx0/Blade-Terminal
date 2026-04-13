import { useEffect, useMemo, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import CardModalField from "@/components/modals/card-modal/CardModalField";
import {
    usePerformanceMonitorModalStore,
    DEFAULT_CHART_WIDTH,
    DEFAULT_CHART_HEIGHT,
} from "../../stores/performanceMonitorModalStore";
import { useChartResize } from "../../hooks/useChartResize";

interface TimeSeriesMetricCardProps {
    metricId: number;
    name: string;
    data: number[];
}

function buildOpts(width: number, height: number, showDots: boolean, name: string): uPlot.Options {
    return {
        width,
        height,
        cursor: { drag: { x: false, y: false } },
        legend: { show: false },
        scales: { x: { time: false } },
        series: [
            {},
            {
                label: name,
                stroke: "#0d9488",
                width: 1.5,
                points: {
                    show: showDots,
                    size: 4,
                    fill: "#0d9488",
                    stroke: "#0d9488",
                },
            },
        ],
        axes: [
            {
                label: "Index",
                labelFont: "14px sans-serif",
                size: 32,
                stroke: "#4b5563",
                ticks: { stroke: "#9ca3af", width: 1, size: 4 },
                border: { show: true, stroke: "#9ca3af", width: 1 },
                grid: { show: true, stroke: "#e5e7eb", width: 1 },
                font: "14px sans-serif",
            },
            {
                label: "Value",
                labelFont: "14px sans-serif",
                stroke: "#4b5563",
                ticks: { stroke: "#9ca3af", width: 1, size: 4 },
                border: { show: true, stroke: "#9ca3af", width: 1 },
                grid: { show: true, stroke: "#e5e7eb", width: 1 },
                font: "14px sans-serif",
                labelGap: 16,
            },
        ],
        hooks: {
            draw: [
                (u) => {
                    const ctx = u.ctx;
                    const { left, top, width: w, height: h } = u.bbox;
                    ctx.save();
                    ctx.strokeStyle = "#9ca3af";
                    ctx.lineWidth = devicePixelRatio;
                    ctx.beginPath();
                    ctx.moveTo(left, top);
                    ctx.lineTo(left + w, top);
                    ctx.moveTo(left + w, top);
                    ctx.lineTo(left + w, top + h);
                    ctx.stroke();
                    ctx.restore();
                },
            ],
        },
    };
}

export default function TimeSeriesMetricCard({ metricId, name, data }: TimeSeriesMetricCardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const uplotRef = useRef<uPlot | null>(null);

    const min = useMemo(() => (data.length > 0 ? Math.min(...data) : null), [data]);
    const max = useMemo(() => (data.length > 0 ? Math.max(...data) : null), [data]);
    const showDots = data.length <= 20;

    const { chartSizes, setChartSize, persistChartSizes } = usePerformanceMonitorModalStore();
    const { width: chartWidth, height: chartHeight } =
        chartSizes[metricId] ?? { width: DEFAULT_CHART_WIDTH, height: DEFAULT_CHART_HEIGHT };

    const { handleResizeMouseDown } = useChartResize({ metricId, chartSizes, setChartSize, persistChartSizes });

    useEffect(() => {
        if (!containerRef.current) return;
        uplotRef.current?.destroy();
        const xData = data.map((_, i) => i);
        uplotRef.current = new uPlot(
            buildOpts(chartWidth, chartHeight, showDots, name),
            [xData, [...data]],
            containerRef.current,
        );
        return () => {
            uplotRef.current?.destroy();
            uplotRef.current = null;
        };
    }, [data, chartWidth, chartHeight, showDots, name]);

    return (
        <div className="px-4 py-3 border-b border-gray-200 last:border-b-0">
            <p className="text-sm font-medium text-gray-700 mb-2 select-none text-center">{name}</p>
            <div className="relative mx-auto" style={{ width: chartWidth, height: chartHeight }}>
                <div ref={containerRef} />
                <span
                    onMouseDown={handleResizeMouseDown}
                    className="material-symbols-outlined absolute bottom-0 right-0 cursor-se-resize select-none text-gray-300 hover:text-gray-600 leading-none rotate-270 z-10"
                    style={{ fontSize: 16 }}
                >
                    resize_window
                </span>
            </div>
            <div className="flex flex-col gap-2 mt-2">
                <CardModalField id="min" label="Min" value={min !== null ? String(min) : "—"} disabled />
                <CardModalField id="max" label="Max" value={max !== null ? String(max) : "—"} disabled />
            </div>
        </div>
    );
}

