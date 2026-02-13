import MenuBarButton from "@/components/MenuBarButton/MenuBarButton";
import MenuBarViewSubmenu from "./MenuBarViewSubmenu";

export default function MenuBarViewButton() {
  return <MenuBarButton label="View" submenu={<MenuBarViewSubmenu />} />;
}
