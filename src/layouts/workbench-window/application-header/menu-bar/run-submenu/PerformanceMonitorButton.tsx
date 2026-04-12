import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { usePerformanceMonitorModalStore } from "@/features/performance-monitor/stores/performanceMonitorModalStore";

export default function PerformanceMonitorButton() {
    const open = usePerformanceMonitorModalStore((s) => s.open);
    return <MenuBarItem label="Performance Monitor..." onClick={open} />;
}
