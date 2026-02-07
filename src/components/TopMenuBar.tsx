import React, { useState, useRef, useEffect } from "react";

interface DropdownMenuProps {
  label: string;
  items: string[];
}

function DropdownMenu({ label, items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle Escape key to close dropdown
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isOpen]);

  // Focus first menu item when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      // Focus first item after render
      setTimeout(() => {
        menuItemsRef.current[0]?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Handle keyboard navigation within menu
  const handleMenuKeyDown = (index: number, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = index < items.length - 1 ? index + 1 : 0;
      setFocusedIndex(nextIndex);
      menuItemsRef.current[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = index > 0 ? index - 1 : items.length - 1;
      setFocusedIndex(prevIndex);
      menuItemsRef.current[prevIndex]?.focus();
    }
  };

  const handleMenuItemClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-sm hover:bg-[var(--color-bg-interactive)] rounded transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`${label} menu`}
      >
        {label}
      </button>
      {isOpen && (
        <div
          role="menu"
          aria-label={`${label} menu items`}
          className="absolute left-0 mt-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded shadow-lg"
          style={{
            minWidth: "150px",
            zIndex: "var(--z-dropdown)",
          }}
        >
          {items.map((item, index) => (
            <button
              key={item}
              ref={(el) => {
                menuItemsRef.current[index] = el;
              }}
              role="menuitem"
              onClick={handleMenuItemClick}
              onKeyDown={(e) => handleMenuKeyDown(index, e)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-interactive)] transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * TopMenuBar Component
 * Displays File/Edit menus and environment title
 */
export function TopMenuBar() {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        height: "2.5rem",
        backgroundColor: "var(--color-bg-secondary)",
        borderBottom: "1px solid var(--color-border)",
        paddingLeft: "1rem",
        paddingRight: "1rem",
      }}
    >
      {/* Left side: Menus */}
      <div className="flex items-center gap-4">
        <DropdownMenu
          label="File"
          items={[
            "New Workspace",
            "Open...",
            "Save",
            "Save As...",
            "Export...",
            "Exit",
          ]}
        />
        <DropdownMenu
          label="Edit"
          items={[
            "Undo",
            "Redo",
            "Cut",
            "Copy",
            "Paste",
            "Select All",
            "Preferences",
          ]}
        />
        <DropdownMenu
          label="View"
          items={[
            "Zoom In",
            "Zoom Out",
            "Fit to View",
            "Reset View",
            "Grid Snap",
            "Show Guides",
          ]}
        />
      </div>

      {/* Center: Environment Title */}
      <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">
        Blade of Grass - Workspace
      </h1>

      {/* Right side: Empty for now */}
      <div className="w-20" />
    </div>
  );
}
