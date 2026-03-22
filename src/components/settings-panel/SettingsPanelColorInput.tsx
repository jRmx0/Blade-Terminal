import { useRef } from "react";

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
    const colorInputRef = useRef<HTMLInputElement>(null);

    // Native <input type="color"> only accepts 6-digit hex; strip alpha if present
    const hexForPicker = value.startsWith("#") ? value.slice(0, 7) : value;

    function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
        // Preserve existing alpha suffix if the stored value has one (#rrggbbaa = 9 chars)
        if (value.length === 9) {
            onChange(e.target.value + value.slice(7));
        } else {
            onChange(e.target.value);
        }
    }

    return (
        <div className="flex items-center gap-3 px-3 h-8">
            <span className="w-[55%] text-xs text-gray-500 shrink-0 truncate select-none">{label}</span>
            <div className={`flex items-center justify-end flex-1 min-w-0 ${disabled ? "opacity-50" : ""}`}>
                {/* Swatch wrapper — no fixed height, relative for picker anchor */}
                <div className="relative shrink-0">
                    <button
                        type="button"
                        aria-label="Pick color"
                        disabled={disabled}
                        onClick={() => !disabled && colorInputRef.current?.click()}
                        className="block w-5 h-4 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-teal-700"
                        style={{ background: value || "#ffffff" }}
                    />
                    {/* Anchored at bottom of swatch so the OS dialog opens downward */}
                    <input
                        ref={colorInputRef}
                        type="color"
                        value={hexForPicker}
                        onChange={handlePickerChange}
                        disabled={disabled}
                        tabIndex={-1}
                        className="absolute top-full left-0 opacity-0 w-0 h-0 pointer-events-none"
                    />
                </div>
            </div>
        </div>
    );
}
