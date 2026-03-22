import { useState, useRef, useEffect } from "react";
import { Sketch } from "@uiw/react-color";

interface SettingsPanelColorInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function SettingsPanelColorInput({
    label,
    value,
    onChange,
    disabled = false,
}: SettingsPanelColorInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
        <div className="flex items-center gap-3 px-3 h-8">
            <span className="w-[55%] text-xs text-gray-500 shrink-0 truncate select-none">{label}</span>
            <div className={`flex items-center justify-end flex-1 min-w-0 ${disabled ? "opacity-50" : ""}`}>
                <div className="relative shrink-0" ref={containerRef}>
                    <button
                        type="button"
                        aria-label="Pick color"
                        disabled={disabled}
                        onClick={() => !disabled && setIsOpen((prev) => !prev)}
                        className="block w-5 h-4 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-teal-700"
                        style={{ background: value || "#ffffff" }}
                    />
                    {isOpen && (
                        <div className="absolute right-0 top-full mt-1 z-50">
                            <Sketch
                                color={value}
                                onChange={(c) => onChange(c.hexa)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
