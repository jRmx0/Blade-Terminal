interface SettingsPanelToggleProps {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}

export default function SettingsPanelToggle({
    label,
    value,
    onChange,
    disabled = false,
}: SettingsPanelToggleProps) {
    return (
        <div className="flex items-center gap-3 px-3 h-8">
            <span className="w-[55%] text-xs text-gray-500 shrink-0 truncate select-none">{label}</span>
            <div className="flex-1 min-w-0 flex items-center">
                <button
                    type="button"
                    role="switch"
                    aria-checked={value}
                    disabled={disabled}
                    onClick={() => !disabled && onChange(!value)}
                    className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                        disabled
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                    } ${value ? "bg-teal-600" : "bg-gray-300"}`}
                >
                    <span
                        className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                            value ? "translate-x-3.5" : "translate-x-0.5"
                        }`}
                    />
                </button>
            </div>
        </div>
    );
}
