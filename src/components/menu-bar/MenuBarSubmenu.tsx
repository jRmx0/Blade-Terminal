import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
    /** Tailwind width class applied to the submenu container. Defaults to "w-80". */
    width?: string;
}

export default function MenuBarSubmenu({ children, width = "w-80" }: Props) {
    return <div className={`${width} py-1 bg-gray-100`}>{children}</div>;
}
