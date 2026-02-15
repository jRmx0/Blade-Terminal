import type { ReactNode } from "react";
import type { MenuId } from "@/types/menu";
import { useMenuStore } from "@/stores/menuStore";

interface MenuBarButtonProps {
  menuId?: MenuId;
  label: string;
  submenu?: ReactNode;
  onClick?: () => void;
}

export default function MenuBarButton({
  menuId,
  label,
  submenu,
  onClick,
}: MenuBarButtonProps) {
  const { activeMenu, setActiveMenu } = useMenuStore();

  const hasSubmenu = !!submenu;
  const isOpen = menuId ? activeMenu === menuId : false;
  const isMenuMode = activeMenu !== null;

  const handleClick = () => {
    if (hasSubmenu) {
      if (isOpen) {
        setActiveMenu(null);
      } else {
        setActiveMenu(menuId || null);
      }
    }
    onClick?.();
  };

  const shouldSwitchMenuOnHover = () => {
    return hasSubmenu && isMenuMode && menuId && activeMenu !== menuId;
  };

  const handleMouseEnter = () => {
    if (shouldSwitchMenuOnHover()) {
      setActiveMenu(menuId as "file" | "view");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        className="px-3 py-1 text-base text-gray-700 rounded hover:bg-gray-200 active:bg-gray-300 cursor-pointer select-none"
      >
        {label}
      </button>

      {/* Submenu Dropdown */}
      {hasSubmenu && isOpen && (
        <div className="absolute left-0 top-full mt-0 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-max">
          {submenu}
        </div>
      )}
    </div>
  );
}
