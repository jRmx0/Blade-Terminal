import type { ReactNode } from "react";

interface InternalListModalRepeaterProps {
    children: ReactNode;
}

export default function InternalListModalRepeater({ children }: InternalListModalRepeaterProps) {
    return <div className="flex flex-col mx-4">{children}</div>;
}