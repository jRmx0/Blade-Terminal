import type { ReactNode } from "react";
import type { MenuId } from "@/types/menuTypes";
import { useMenuStore } from "@/stores/menuStore";

interface MenuBarButtonProps {
  menuId: MenuId;
  label: string;
  submenu: ReactNode;
  onClick?: () => void;
}

export default function MenuBarButton({
  menuId,
  label,
  submenu,
  onClick,
}: MenuBarButtonProps) {
  const { activeMenu, setActiveMenu } = useMenuStore();

  const isOpen = activeMenu === menuId;
  const isMenuMode = activeMenu !== null;

  const handleClick = () => {
    if (isOpen) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuId);
    }
    onClick?.();
  };

  const handleMouseEnter = () => {
    if (isMenuMode && activeMenu !== menuId) {
      setActiveMenu(menuId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setActiveMenu(null);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onKeyDown={handleKeyDown}
        className="px-3 mt-1 text-base text-gray-700 rounded hover:bg-gray-200 active:bg-gray-300 cursor-pointer select-none"
      >
        {label}
      </button>

      {/* Submenu Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-0 bg-white border border-gray-300 rounded shadow-lg z-20 min-w-max">
          {submenu}
        </div>
      )}
    </div>
  );
}
