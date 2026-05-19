import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useParameterBenchmarkModalStore } from "@/features/benchmark-manager/stores/parameterBenchmarkModalStore";

export default function ParameterBenchmarkButton() {
    const open = useParameterBenchmarkModalStore((s) => s.open);
    return <MenuBarItem label="Parameter Benchmark..." onClick={open} />;
}
