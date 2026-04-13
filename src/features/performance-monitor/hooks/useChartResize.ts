import { useCallback, useRef } from "react";
import {
    DEFAULT_CHART_WIDTH,
    DEFAULT_CHART_HEIGHT,
    MODAL_CHROME_W,
    type ChartSize,
} from "../stores/performanceMonitorModalStore";

const MIN_CHART_W = 200;
const MIN_CHART_H = 80;

interface UseChartResizeOptions {
    metricId: number;
    chartSizes: Record<number, ChartSize>;
    setChartSize: (metricId: number, width: number, height: number) => void;
    persistChartSizes: () => Promise<void>;
}

export function useChartResize({ metricId, chartSizes, setChartSize, persistChartSizes }: UseChartResizeOptions) {
    const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

    const handleResizeMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const current = chartSizes[metricId] ?? { width: DEFAULT_CHART_WIDTH, height: DEFAULT_CHART_HEIGHT };
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                startW: current.width,
                startH: current.height,
            };

            const maxChartWidth = Math.floor(window.innerWidth * 0.9) - MODAL_CHROME_W;

            const onMouseMove = (event: MouseEvent) => {
                if (!dragRef.current) return;
                const { startX, startY, startW, startH } = dragRef.current;
                const newW = Math.max(MIN_CHART_W, Math.min(maxChartWidth, startW + (event.clientX - startX)));
                const newH = Math.max(MIN_CHART_H, startH + (event.clientY - startY));
                setChartSize(metricId, newW, newH);
            };

            const onMouseUp = () => {
                dragRef.current = null;
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                void persistChartSizes();
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        },
        [metricId, chartSizes, setChartSize, persistChartSizes],
    );

    return { handleResizeMouseDown };
}
