import MenuBarButton from "@/components/MenuBarButton/MenuBarButton";
import MenuBarViewSubmenu from "./MenuBarViewSubmenu";

export default function MenuBarViewButton() {
  return (
    <MenuBarButton
      menuId="view"
      label="View"
      submenu={<MenuBarViewSubmenu />}
    />
  );
}
