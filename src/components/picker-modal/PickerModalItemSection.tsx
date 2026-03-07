interface PickerModalItemSectionProps {
    children: React.ReactNode;
}

export default function PickerModalItemSection({ children }: PickerModalItemSectionProps) {
    return (
        <div className="flex-1 overflow-y-auto border-t border-b border-gray-200">
            {children}
        </div>
    );
}
