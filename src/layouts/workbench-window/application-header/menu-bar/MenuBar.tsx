import { useEffect, useRef } from "react";
import MenuBarFileButton from "@/layouts/workbench-window/application-header/menu-bar/file-submenu/MenuBarFileButton";
import MenuBarViewButton from "@/layouts/workbench-window/application-header/menu-bar/view-submenu/MenuBarViewButton";
import { useMenuStore } from "@/stores/menuStore";

export default function MenuBar() {
  const menuBarRef = useRef<HTMLDivElement>(null);
  const { setActiveMenu } = useMenuStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuBarRef.current &&
        !menuBarRef.current.contains(event.target as Node)
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [setActiveMenu]);

  return (
    <div ref={menuBarRef} className="flex items-center">
      <MenuBarFileButton />
      <MenuBarViewButton />
    </div>
  );
}
