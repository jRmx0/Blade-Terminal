import ManageProvidersButton from "./ManageProvidersButton";
import PerformanceMonitorButton from "./PerformanceMonitorButton";
import MenuBarSubmenu from "@/components/menu-bar/MenuBarSubmenu";

export default function MenuBarRunSubmenu() {
    return (
        <MenuBarSubmenu>
            <ManageProvidersButton />
            <PerformanceMonitorButton />
        </MenuBarSubmenu>
    );
}
