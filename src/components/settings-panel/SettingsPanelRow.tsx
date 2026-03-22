import { forwardRef } from "react";

interface SettingsPanelRowProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string;
    children: React.ReactNode;
}

const SettingsPanelRow = forwardRef<HTMLDivElement, SettingsPanelRowProps>(
    ({ label, children, ...rest }, ref) => (
        <div ref={ref} {...rest} className="flex items-center gap-3 px-3 h-8">
            <span className="w-[55%] text-xs text-gray-500 shrink-0 truncate select-none">{label}</span>
            {children}
        </div>
    ),
);

SettingsPanelRow.displayName = "SettingsPanelRow";

export default SettingsPanelRow;
