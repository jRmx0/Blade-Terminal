import { useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    XAxis,
    YAxis,
    Tooltip,
    Line,
} from "recharts";
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

export default function TimeSeriesMetricCard({ metricId, name, data }: TimeSeriesMetricCardProps) {
    const chartData = useMemo(() => data.map((v, i) => ({ index: i, value: v })), [data]);

    const min = useMemo(() => (data.length > 0 ? Math.min(...data) : null), [data]);
    const max = useMemo(() => (data.length > 0 ? Math.max(...data) : null), [data]);
    const showDots = data.length <= 20;

    const { chartSizes, setChartSize, persistChartSizes } = usePerformanceMonitorModalStore();
    const { width: chartWidth, height: chartHeight } =
        chartSizes[metricId] ?? { width: DEFAULT_CHART_WIDTH, height: DEFAULT_CHART_HEIGHT };

    const { handleResizeMouseDown } = useChartResize({ metricId, chartSizes, setChartSize, persistChartSizes });

    return (
        <div className="px-4 py-3 border-b border-gray-200 last:border-b-0">
            <p className="text-sm font-medium text-gray-700 mb-2 select-none text-center">{name}</p>
            <div className="relative mx-auto" style={{ width: chartWidth, height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <XAxis
                            dataKey="index"
                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e7eb" }}
                            interval="equidistantPreserveStart"
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                            width={48}
                        />
                        <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e5e7eb" }}
                            labelFormatter={(v) => `Index: ${v}`}
                            formatter={(v) => [v, name]}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#0d9488"
                            strokeWidth={1.5}
                            dot={showDots ? { r: 2, fill: "#0d9488" } : false}
                            activeDot={{ r: 4 }}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
                <span
                    onMouseDown={handleResizeMouseDown}
                    className="material-symbols-outlined absolute bottom-0 right-0 cursor-se-resize select-none text-gray-300 hover:text-gray-600 leading-none rotate-270"
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

