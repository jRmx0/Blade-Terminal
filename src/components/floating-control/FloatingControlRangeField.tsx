import { useState } from "react";

interface FloatingControlRangeFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    /** Inclusive lower bound for clamping. */
    min?: number;
    /** Inclusive upper bound for clamping. */
    max?: number;
    placeholder?: string;
    /** Small italic text shown after the dotted leader (e.g. a seed-derived pick preview). */
    preview?: string;
    disabled?: boolean;
}

/** Parse the raw string into a resolved value for external use.
 *  Returns [lo, hi] for ranges, a single number for exact values, or undefined when blank/invalid. */
export function parseRangeFieldValue(raw: string): number | [number, number] | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const rangeMatch = trimmed.match(/^(-?\d+)\.\.(-?\d+)$/);
    if (rangeMatch) {
        const a = parseInt(rangeMatch[1]!, 10);
        const b = parseInt(rangeMatch[2]!, 10);
        if (isFinite(a) && isFinite(b)) return [a, b];
    }
    const n = parseInt(trimmed, 10);
    if (isFinite(n)) return n;
    return undefined;
}

export default function FloatingControlRangeField({
    label,
    value,
    onChange,
    min,
    max,
    placeholder,
    preview,
    disabled = false,
}: FloatingControlRangeFieldProps) {
    const [isFocused, setIsFocused] = useState(false);

    function clamp(n: number): number {
        if (min !== undefined && n < min) return min;
        if (max !== undefined && n > max) return max;
        return n;
    }

    function handleBlur() {
        setIsFocused(false);
        const trimmed = value.trim();
        if (!trimmed) return;

        // Try range syntax: N..M
        const rangeMatch = trimmed.match(/^(-?\d+)\.\.(-?\d+)$/);
        if (rangeMatch) {
            let lo = clamp(parseInt(rangeMatch[1]!, 10));
            let hi = clamp(parseInt(rangeMatch[2]!, 10));
            if (lo > hi) [lo, hi] = [hi, lo];
            onChange(`${lo}..${hi}`);
            return;
        }

        // Try single integer
        const n = parseInt(trimmed, 10);
        if (isFinite(n)) {
            onChange(String(clamp(n)));
            return;
        }

        // Invalid — clear
        onChange("");
    }

    return (
        <div className="flex items-center gap-2 px-3 h-8">
            <div className="w-29/50 shrink-0 flex items-center gap-1 min-w-0">
                <span className="text-xs text-gray-500 shrink-0 truncate select-none">{label}</span>
                <span className="flex-1 min-w-0 h-1 bg-[radial-gradient(circle,#d1d5db_1.5px,transparent_1.5px)] bg-size-[10px_10px] bg-repeat-x bg-center" />
                {preview && (
                    <span className="text-xs text-gray-400 italic shrink-0 select-none">{preview}</span>
                )}
            </div>
            <div className="relative flex-1 min-w-0">
                <input
                    type="text"
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    className={`w-full border rounded bg-white text-xs px-2 h-6 focus:outline-none transition-colors placeholder:text-gray-400 placeholder:italic ${isFocused ? "border-teal-700" : "border-gray-300"
                        } ${disabled ? "text-gray-400 cursor-not-allowed opacity-50" : "text-gray-900"}`}
                />
            </div>
        </div>
    );
}
