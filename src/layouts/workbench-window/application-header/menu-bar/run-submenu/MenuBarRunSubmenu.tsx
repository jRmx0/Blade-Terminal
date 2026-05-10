import ManageProvidersButton from "./ManageProvidersButton";
import PerformanceMonitorButton from "./PerformanceMonitorButton";
import ParameterBenchmarkButton from "./ParameterBenchmarkButton";
import MenuBarSubmenu from "@/components/menu-bar/MenuBarSubmenu";

export default function MenuBarRunSubmenu() {
    return (
        <MenuBarSubmenu>
            <ParameterBenchmarkButton />
            <ManageProvidersButton />
            <PerformanceMonitorButton />
        </MenuBarSubmenu>
    );
}
