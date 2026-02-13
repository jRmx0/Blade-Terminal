// TODO: State management with zustand

import { useState } from "react";
import type { ReactNode } from "react";

interface MenuBarListButtonProps {
  label: string;
  hasCheckmark?: boolean;
  defaultChecked?: boolean;
  shortcut?: string[];
  submenu?: ReactNode;
  onClick?: () => void;
}

export default function MenuBarListButton({
  label,
  hasCheckmark,
  defaultChecked = false,
  shortcut,
  submenu,
  onClick,
}: MenuBarListButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [checked, setChecked] = useState(defaultChecked);

  const hasSubmenu = !!submenu;
  const shortcutText = shortcut?.join("+") || "";

  const handleClick = () => {
    if (hasCheckmark) {
      setChecked(!checked);
    }
    onClick?.();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center gap-2 px-3 py-1 w-full text-left text-sm text-gray-700 hover:bg-blue-100 rounded cursor-pointer select-none"
      >
        {/* Left: Checkmark space */}
        <div className="w-5 shrink-0">
          {hasCheckmark && (
            <span className="text-sm leading-none">{checked ? "✓" : " "}</span>
          )}
        </div>

        {/* Center: Label */}
        <span className="flex-1">{label}</span>

        {/* Right: Shortcut or Arrow */}
        {(shortcutText || hasSubmenu) && (
          <div className="text-xs text-gray-500 shrink-0">
            {hasSubmenu ? "▶" : shortcutText}
          </div>
        )}
      </button>

      {/* Submenu */}
      {hasSubmenu && isHovered && (
        <div className="absolute left-full top-0 ml-1 min-w-max bg-white border border-gray-300 rounded shadow-lg z-10">
          {submenu}
        </div>
      )}
    </div>
  );
}
