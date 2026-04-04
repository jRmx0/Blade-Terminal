import ManageProvidersButton from "./ManageProvidersButton";
import MenuBarSubmenu from "@/components/menu-bar/MenuBarSubmenu";

export default function MenuBarRunSubmenu() {
    return (
        <MenuBarSubmenu width="w-64">
            <ManageProvidersButton />
        </MenuBarSubmenu>
    );
}
