import { useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    XAxis,
    YAxis,
    Tooltip,
    Line,
} from "recharts";

interface TimeSeriesMetricCardProps {
    name: string;
    data: number[];
}

export default function TimeSeriesMetricCard({ name, data }: TimeSeriesMetricCardProps) {
    const chartData = useMemo(() => data.map((v, i) => ({ index: i, value: v })), [data]);

    const min = useMemo(() => (data.length > 0 ? Math.min(...data) : null), [data]);
    const max = useMemo(() => (data.length > 0 ? Math.max(...data) : null), [data]);
    const showDots = data.length <= 20;

    return (
        <div className="px-4 py-3 border-b border-gray-100 last:border-b-0">
            <p className="text-sm font-medium text-gray-700 mb-2 select-none">{name}</p>
            <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <XAxis
                            dataKey="index"
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e7eb" }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
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
            </div>
            <div className="flex gap-6 mt-2">
                <span className="text-xs text-gray-500 select-none">
                    Min: <span className="font-mono font-medium text-gray-700">{min !== null ? min : "—"}</span>
                </span>
                <span className="text-xs text-gray-500 select-none">
                    Max: <span className="font-mono font-medium text-gray-700">{max !== null ? max : "—"}</span>
                </span>
            </div>
        </div>
    );
}
