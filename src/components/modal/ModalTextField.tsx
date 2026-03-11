import { forwardRef } from "react";

export type ModalTextFieldHintState = "info" | "warning" | "error";

interface ModalTextFieldProps {
    label: string;
    value: string;
    placeholder?: string;
    type?: "text" | "password";
    required?: boolean;
    disabled?: boolean;
    hint?: string;
    hintState?: ModalTextFieldHintState;
    onChange?: (value: string) => void;
    onConfirm?: () => void;
}

const HINT_STYLE: Record<ModalTextFieldHintState, { icon: string; color: string }> = {
    info: { icon: "info", color: "text-gray-400 hover:text-teal-600" },
    warning: { icon: "warning", color: "text-amber-500 hover:text-amber-600" },
    error: { icon: "error", color: "text-red-500 hover:text-red-600" },
};

const ModalTextField = forwardRef<HTMLInputElement, ModalTextFieldProps>(
    ({ label, value, placeholder, type = "text", required = false, disabled = false, hint, hintState = "info", onChange, onConfirm }, ref) => {
        const hs = HINT_STYLE[hintState];
        const showRequiredMarker = required && value.trim().length === 0;

        return (
            <div className="flex items-start gap-3 min-w-0">
                {/* Label + dot leader + optional hint button — 1/3 */}
                <div className="w-1/3 shrink-0 h-9 flex items-center gap-1 min-w-0">
                    <label
                        className="text-sm text-gray-500 tracking-wide whitespace-nowrap shrink-0 cursor-default"
                        title={label}
                    >
                        {label}
                    </label>
                    {showRequiredMarker && (
                        <span className="text-red-500 text-sm leading-none shrink-0 cursor-default" title="Required field" aria-hidden="true">
                            *
                        </span>
                    )}
                    <span className="flex-1 min-w-0 h-1 bg-[radial-gradient(circle,#d1d5db_1.5px,transparent_1.5px)] bg-size-[10px_10px] bg-repeat-x bg-center" />
                    {hint && (
                        <span
                            className={`shrink-0 flex items-center cursor-default transition-colors ${hs.color}`}
                            title={hint}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{hs.icon}</span>
                        </span>
                    )}
                </div>

                {/* Field — 2/3 */}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <input
                        ref={ref}
                        type={type}
                        value={value}
                        placeholder={placeholder}
                        required={required}
                        aria-required={required}
                        disabled={disabled}
                        title={type !== "password" ? value || placeholder : undefined}
                        onChange={(e) => onChange?.(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onConfirm?.();
                        }}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-teal-600 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-default truncate"
                    />
                </div>
            </div>
        );
    },
);

ModalTextField.displayName = "ModalTextField";

export default ModalTextField;
