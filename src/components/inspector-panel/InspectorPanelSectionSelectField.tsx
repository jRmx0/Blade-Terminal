import { useState, useRef, useEffect } from "react";

interface InspectorPanelSectionSelectFieldProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    disabled?: boolean;
    onChange: (value: string) => void;
}

export default function InspectorPanelSectionSelectField({
    label,
    value,
    options,
    disabled,
    onChange,
}: InspectorPanelSectionSelectFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

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
        <div className="flex items-center gap-2 px-5 py-1" ref={containerRef}>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-800" title={label}>
                {label}
            </span>
            <div className="relative shrink-0">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen((prev) => !prev)}
                    className={`flex items-center gap-1 rounded border bg-white px-2 py-0.5 text-sm transition-colors focus:outline-none ${isOpen ? "border-teal-700" : "border-gray-300"
                        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                    <span className={disabled ? "text-gray-400" : "text-gray-900"}>{selectedLabel}</span>
                    <span
                        className={`material-symbols-outlined transition-transform duration-150 ${isOpen ? "rotate-180 text-teal-700" : "text-gray-400"
                            }`}
                        style={{ fontSize: 14 }}
                    >
                        expand_more
                    </span>
                </button>

                {isOpen && !disabled && (
                    <div className="absolute right-0 top-full mt-0.5 z-50 min-w-full border border-gray-300 rounded shadow-md overflow-hidden">
                        <ul
                            role="listbox"
                            className="bg-white max-h-40 overflow-y-auto"
                        >
                            {options.map((opt) => (
                                <li key={opt.value} role="option" aria-selected={opt.value === value} className="border-b-2 border-white last:border-b-0">
                                    <button
                                        type="button"
                                        className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-teal-600 hover:text-white ${opt.value === value ? "bg-teal-600 text-white font-medium" : "text-gray-700"
                                            }`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
