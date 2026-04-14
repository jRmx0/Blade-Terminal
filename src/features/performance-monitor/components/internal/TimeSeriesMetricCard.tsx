import { useMemo, useRef } from "react";
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
import {
    usePerformanceMonitorModalStore,
    DEFAULT_CHART_WIDTH,
    DEFAULT_CHART_HEIGHT,
} from "../../stores/performanceMonitorModalStore";
import { useChartResize } from "../../hooks/useChartResize";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
    xAxisLabel?: string;
    yAxisLabel?: string;
}

export default function TimeSeriesMetricCard({ metricId, name, data, xAxisLabel, yAxisLabel }: TimeSeriesMetricCardProps) {
    const chartRef = useRef<ChartJS<"line"> | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const min = useMemo(() => (data.length > 0 ? Math.min(...data) : null), [data]);
    const max = useMemo(() => (data.length > 0 ? Math.max(...data) : null), [data]);
    const showDots = data.length <= 20;

    const titlePlugin = useMemo<Plugin<"line">>(
        () => ({
            id: "centerTitle",
            beforeDraw(chart) {
                const { ctx, chartArea: { left, right, top } } = chart;
                ctx.save();
                ctx.fillStyle = "#374151";
                ctx.font = "16px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                const maxWidth = right - left;
                let label = name;
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
        [name],
    );

    const { chartSizes, setChartSize, persistChartSizes } = usePerformanceMonitorModalStore();
    const { width: chartWidth, height: chartHeight } =
        chartSizes[metricId] ?? { width: DEFAULT_CHART_WIDTH, height: DEFAULT_CHART_HEIGHT };

    const { handleResizeMouseDown } = useChartResize({ metricId, chartSizes, setChartSize, persistChartSizes, chartRef, containerRef });

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
                        title: (items) => `${xAxisLabel ?? "Index"}: ${items[0]?.label ?? ""}`,
                        label: (item) => `${name}: ${item.raw}`,
                    },
                },
            },
            scales: {
                x: {
                    title: { display: true, text: xAxisLabel ?? "Index", font: { size: 14 }, color: "#4b5563" },
                    ticks: { font: { size: 14 }, color: "#4b5563", maxRotation: 0 },
                    grid: { color: "#e5e7eb" },
                    border: { color: "#9ca3af" },
                },
                y: {
                    title: { display: true, text: yAxisLabel ?? "Value", font: { size: 14 }, color: "#4b5563" },
                    ticks: { font: { size: 14 }, color: "#4b5563" },
                    grid: { color: "#e5e7eb" },
                    border: { color: "#9ca3af" },
                },
            },
        }),
        [name, xAxisLabel, yAxisLabel],
    );

    return (
        <div className="px-4 py-3 border-b border-gray-200 last:border-b-0">
            <div className="relative mx-auto" ref={containerRef} style={{ width: chartWidth, height: chartHeight }}>
                <Line
                    ref={chartRef}
                    data={chartData}
                    options={options}
                    plugins={[borderBoxPlugin, titlePlugin]}
                />
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

