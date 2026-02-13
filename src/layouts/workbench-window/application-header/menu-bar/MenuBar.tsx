import MenuBarFileButton from "@/layouts/workbench-window/application-header/menu-bar/file-list/MenuBarFileButton";
import MenuBarViewButton from "@/layouts/workbench-window/application-header/menu-bar/view-list/MenuBarViewButton";

export default function MenuBar() {
  return (
    <div className="flex items-center">
      <MenuBarFileButton />
      <MenuBarViewButton />
    </div>
  );
}
