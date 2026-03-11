import ModalAction, { type ModalActionStatus } from "@/components/modal/modal-action-bar/ModalAction";

export interface ModalActionBarItem {
    id: string;
    icon: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    status?: ModalActionStatus;
    statusMessage?: string;
}

interface ModalActionBarProps {
    actions: ModalActionBarItem[];
}

export default function ModalActionBar({ actions }: ModalActionBarProps) {
    if (actions.length === 0) return null;

    return (
        <div className="flex items-center gap-2 py-2 mx-4 bg-gray-100 border-t-2 border-b-2 border-gray-200 shrink-0 flex-wrap">
            {actions.map((action) => (
                <ModalAction key={action.id} {...action} />
            ))}
        </div>
    );
}
