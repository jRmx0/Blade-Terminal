import MenuBarButton from "@/components/MenuBarButton/MenuBarButton";
import MenuBarFileSubmenu from "./MenuBarFileSubmenu";

export default function MenuBarFileButton() {
  return (
    <MenuBarButton
      menuId="file"
      label="File"
      submenu={<MenuBarFileSubmenu />}
    />
  );
}
