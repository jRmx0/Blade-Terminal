import MenuBarButton from "@/components/MenuBarButton/MenuBarButton";
import MenuBarFileSubmenu from "./MenuBarFileSubmenu";

export default function MenuBarFileButton() {
  return <MenuBarButton label="File" submenu={<MenuBarFileSubmenu />} />;
}
