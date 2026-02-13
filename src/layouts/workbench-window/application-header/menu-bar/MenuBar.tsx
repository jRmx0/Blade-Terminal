import MenuBarFileButton from "@/layouts/workbench-window/application-header/menu-bar/file-submenu/MenuBarFileButton";
import MenuBarViewButton from "@/layouts/workbench-window/application-header/menu-bar/view-submenu/MenuBarViewButton";

export default function MenuBar() {
  return (
    <div className="flex items-center">
      <MenuBarFileButton />
      <MenuBarViewButton />
    </div>
  );
}
