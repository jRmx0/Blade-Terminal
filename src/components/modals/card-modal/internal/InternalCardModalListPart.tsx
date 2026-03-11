import type { ReactNode } from "react";

interface InternalCardModalListPartProps {
    title: string;
    badge?: ReactNode;
    children: ReactNode;
}

export default function InternalCardModalListPart({ title, badge, children }: InternalCardModalListPartProps) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
                {badge}
            </div>
            {children}
        </div>
    );
}