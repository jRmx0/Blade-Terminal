import { useCallback, useState } from "react";
import type { InternalCardModalListPartRowId } from "./types";

interface UseInternalCardModalListPartActionsOptions {
    onReplaceSelection?: (rowId: InternalCardModalListPartRowId) => void;
}

export default function useInternalCardModalListPartActions({
    onReplaceSelection,
}: UseInternalCardModalListPartActionsOptions) {
    const [openMenuRowId, setOpenMenuRowId] = useState<InternalCardModalListPartRowId | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

    const closeMenu = useCallback(() => {
        setOpenMenuRowId(null);
        setMenuPos(null);
    }, []);

    const handleMoreClick = useCallback((event: React.MouseEvent<HTMLButtonElement>, rowId: InternalCardModalListPartRowId) => {
        event.stopPropagation();
        onReplaceSelection?.(rowId);

        const rect = event.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 2, left: rect.left });
        setOpenMenuRowId(rowId);
    }, [onReplaceSelection]);

    return {
        openMenuRowId,
        menuPos,
        closeMenu,
        handleMoreClick,
    };
}
