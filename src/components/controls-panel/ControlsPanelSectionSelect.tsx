import { useState, useRef, useEffect } from "react";
import type { ControlsPanelSectionSelectProps } from "@/types/controlsPanelTypes";

export default function ControlsPanelSectionSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: ControlsPanelSectionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const hasValue = !!value;
  const isFloated = hasValue || isOpen;

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
  }

  return (
    <div className="relative mx-3 my-1" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        className={`relative w-full border rounded bg-white text-left select-none focus:outline-none transition-colors ${isOpen ? "border-teal-700" : "border-gray-300"
          } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        {/* Floating label */}
        <span
          className={`absolute pointer-events-none select-none transition-all duration-150 leading-none ${isFloated
            ? `top-1 bottom-1 left-3 text-xs ${isOpen ? "text-teal-700" : "text-gray-500"}`
            : "top-1/2 -translate-y-1/2 left-3 text-sm text-gray-400"
            }`}
        >
          {label}
        </span>

        {/* Value + chevron */}
        <div className={`flex items-center px-3 gap-1 ${isFloated ? "pt-5 pb-1" : "py-1.5"}`}>
          <span
            className={`text-sm flex-1 truncate ${!hasValue ? "invisible" : disabled ? "text-gray-400" : "text-gray-900"
              }`}
          >
            {selectedOption?.label ?? "\u00A0"}
          </span>
          <span
            className={`material-symbols-outlined shrink-0 transition-transform duration-150 ${disabled ? "text-gray-300" : isOpen ? "rotate-180 text-teal-700" : "text-gray-400"
              }`}
            style={{ fontSize: 16 }}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* Dropdown list */}
      {isOpen && !disabled && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-0.5 border border-gray-300 bg-white rounded shadow-md z-50 max-h-40 overflow-y-auto"
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-teal-600 hover:text-white ${option.value === value
                  ? "bg-teal-600 text-white font-medium"
                  : "text-gray-700"
                  }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option.value);
                }}
              >
                {option.label || "\u00A0"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
