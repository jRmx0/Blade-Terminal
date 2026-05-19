import { forwardRef } from "react";

export type CardModalTextFieldHintState = "info" | "warning" | "error";

const HINT_STYLE: Record<CardModalTextFieldHintState, { icon: string; color: string }> = {
    info: { icon: "info", color: "text-gray-400 hover:text-teal-600" },
    warning: { icon: "warning", color: "text-amber-500 hover:text-amber-600" },
    error: { icon: "error", color: "text-red-500 hover:text-red-600" },
};

interface CardModalFieldBase {
    id: string;
    label: string;
    disabled?: boolean;
    hint?: string;
    hintState?: CardModalTextFieldHintState;
}

interface CardModalInputConfig extends CardModalFieldBase {
    type?: "text" | "password" | "number";
    value: string;
    placeholder?: string;
    required?: boolean;
    onChange?: (value: string) => void;
    onConfirm?: () => void;
}

interface CardModalSelectConfig extends CardModalFieldBase {
    type: "select";
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange?: (value: string) => void;
}

interface CardModalCheckboxConfig extends CardModalFieldBase {
    type: "checkbox";
    checked: boolean;
    onChange?: (checked: boolean) => void;
}

export type CardModalFieldConfig =
    | CardModalInputConfig
    | CardModalSelectConfig
    | CardModalCheckboxConfig;

function isInputVariant(config: CardModalFieldConfig): config is CardModalInputConfig {
    return config.type !== "select" && config.type !== "checkbox";
}

const CardModalField = forwardRef<HTMLInputElement, CardModalFieldConfig>((props, ref) => {
    const { label, disabled = false, hint, hintState = "info" } = props;
    const hs = HINT_STYLE[hintState];
    const showRequiredMarker =
        isInputVariant(props) && props.required === true && props.value.trim().length === 0;

    return (
        <div className="flex items-start gap-3 min-w-0">
            {/* Label */}
            <div className="w-1/3 shrink-0 h-8 flex items-center gap-1 min-w-0">
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

            {/* Control */}
            {props.type === "select" ? (
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <select
                        value={props.value}
                        disabled={disabled}
                        onChange={(e) => props.onChange?.(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-800 bg-white focus:outline-none focus:border-teal-600 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-default"
                    >
                        {props.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            ) : props.type === "checkbox" ? (
                <div className="flex-1 min-w-0 h-8 flex items-center">
                    <input
                        type="checkbox"
                        checked={props.checked}
                        disabled={disabled}
                        onChange={(e) => props.onChange?.(e.target.checked)}
                        className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer disabled:cursor-default"
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <input
                        ref={ref}
                        type={props.type ?? "text"}
                        value={props.value}
                        placeholder={props.placeholder}
                        required={props.required}
                        aria-required={props.required}
                        disabled={disabled}
                        title={props.type !== "password" ? props.value || props.placeholder : undefined}
                        onChange={(e) => props.onChange?.(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") props.onConfirm?.();
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-teal-600 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-default truncate"
                    />
                </div>
            )}
        </div>
    );
});

CardModalField.displayName = "CardModalField";

export default CardModalField;
