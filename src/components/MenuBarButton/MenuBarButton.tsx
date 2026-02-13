import { useState } from "react";
import type { ReactNode } from "react";

interface MenuBarButtonProps {
  label: string;
  submenu?: ReactNode;
  onClick?: () => void;
}

export default function MenuBarButton({
  label,
  submenu,
  onClick,
}: MenuBarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubmenu = !!submenu;

  const handleClick = () => {
    if (hasSubmenu) {
      setIsOpen(!isOpen);
    }
    onClick?.();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
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
