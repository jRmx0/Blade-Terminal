import { useState, useRef, useEffect } from "react";

export interface SettingsPanelSelectOption {
    value: string;
    label: string;
}

interface SettingsPanelSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SettingsPanelSelectOption[];
    disabled?: boolean;
}

export default function SettingsPanelSelect({
    label,
    value,
    onChange,
    options,
    disabled = false,
}: SettingsPanelSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((o) => o.value === value);

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

    return (
        <div className="flex items-center gap-3 px-3 h-8" ref={containerRef}>
            <span className="w-[55%] text-xs text-gray-500 shrink-0 truncate select-none">{label}</span>
            <div className="relative flex-1 min-w-0">
                <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    onClick={() => !disabled && setIsOpen((prev) => !prev)}
                    disabled={disabled}
                    className={`w-full flex items-center gap-1 border rounded bg-white text-left select-none focus:outline-none transition-colors px-2 h-6 ${isOpen ? "border-teal-700" : "border-gray-300"
                        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                        }`}
                >
                    <span className={`text-xs flex-1 truncate ${disabled ? "text-gray-400" : "text-gray-900"}`}>
                        {selectedOption?.label ?? "\u00A0"}
                    </span>
                    <span
                        className={`material-symbols-outlined shrink-0 transition-transform duration-150 ${disabled ? "text-gray-300" : isOpen ? "rotate-180 text-teal-700" : "text-gray-400"
                            }`}
                        style={{ fontSize: 14 }}
                    >
                        expand_more
                    </span>
                </button>

                {isOpen && !disabled && (
                    <ul
                        role="listbox"
                        className="absolute left-0 right-0 top-full mt-0.5 border border-gray-300 bg-white rounded shadow-md z-50 max-h-40 overflow-y-auto"
                    >
                        {options.map((option) => (
                            <li key={option.value} role="option" aria-selected={option.value === value}>
                                <button
                                    type="button"
                                    className={`w-full text-left px-3 py-1 text-xs cursor-pointer transition-colors hover:bg-teal-600 hover:text-white ${option.value === value ? "bg-teal-600 text-white font-medium" : "text-gray-700"
                                        }`}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    {option.label || "\u00A0"}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
