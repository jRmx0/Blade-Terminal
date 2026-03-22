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
            <div
                ref={containerRef}
                className={`relative flex-1 min-w-0 flex items-center border border-gray-300 rounded bg-white h-6 ${disabled ? "opacity-50" : ""}`}
            >
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="flex-1 min-w-0 text-xs px-2 bg-transparent outline-none text-gray-700"
                />
                <button
                    type="button"
                    aria-label="Pick color"
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen((prev) => !prev)}
                    className="w-5 h-3.5 mr-1.5 shrink-0 cursor-pointer disabled:cursor-not-allowed focus:outline-none"
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
    );
}
