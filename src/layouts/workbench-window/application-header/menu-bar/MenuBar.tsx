import { useEffect, useRef } from "react";
import { useMenuStore } from "@/stores/menuStore";
import MenuBarButton from "@/components/menu-bar/MenuBarButton";
import MenuBarFileSubmenu from "./file-submenu/MenuBarFileSubmenu";
import MenuBarEditSubmenu from "./edit-submenu/MenuBarEditSubmenu";
import MenuBarViewSubmenu from "./view-submenu/MenuBarViewSubmenu";
import MenuBarRunSubmenu from "./run-submenu/MenuBarRunSubmenu";
import MenuBarMoreButton from "./more-submenu/MenuBarMoreButton";
import type { MenuId } from "@/types/menuTypes";
import type { ReactNode } from "react";

interface MenuItem {
  menuId: MenuId;
  label: string;
  submenu: ReactNode;
}

const MENU_ITEMS: MenuItem[] = [
  { menuId: "file", label: "File", submenu: <MenuBarFileSubmenu /> },
  { menuId: "edit", label: "Edit", submenu: <MenuBarEditSubmenu /> },
  { menuId: "view", label: "View", submenu: <MenuBarViewSubmenu /> },
  { menuId: "run", label: "Run", submenu: <MenuBarRunSubmenu /> },
];

export default function MenuBar() {
  const menuBarRef = useRef<HTMLDivElement>(null);
  const { setActiveMenu } = useMenuStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setActiveMenu]);

  return (
    <div ref={menuBarRef} className="flex items-center">
      {MENU_ITEMS.map((item) => (
        <MenuBarButton
          key={item.menuId}
          menuId={item.menuId}
          label={item.label}
          submenu={item.submenu}
        />
      ))}
      <MenuBarMoreButton items={MENU_ITEMS} />
    </div>
  );
}

