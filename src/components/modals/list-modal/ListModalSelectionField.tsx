import { forwardRef } from "react";

interface ListModalSelectionFieldProps {
    label?: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    onConfirm?: () => void;
}

const ListModalSelectionField = forwardRef<HTMLInputElement, ListModalSelectionFieldProps>(
    ({ label = "File name:", value, placeholder, onChange, onConfirm }, ref) => (
        <div className="flex items-center gap-3 px-4 pt-3 pb-1">
            <label className="text-sm text-gray-600 shrink-0">{label}</label>
            <input
                ref={ref}
                type="text"
                className="flex-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded outline-none focus:border-gray-400 text-gray-700"
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") onConfirm?.();
                }}
            />
        </div>
    ),
);

ListModalSelectionField.displayName = "ModalFileNameField";

export default ListModalSelectionField;
