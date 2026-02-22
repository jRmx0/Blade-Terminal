import { useEffect } from "react";
import { parseShortcut, type ParsedShortcut } from "@/utils/parseShortcut";

export interface ShortcutEntry {
    parsed: ParsedShortcut;
    handler: () => void;
    /** Optional context name. If set, shortcut only fires when this context is active. */
    context?: string;
}

/**
 * Module-level registry shared between useShortcut and ShortcutManager.
 * Keyed by a stable shortcut id (e.g. "inspector.toggle").
 * Functions are not stored in Zustand — this plain Map avoids serialization issues.
 */
export const shortcutRegistry = new Map<string, ShortcutEntry>();

/**
 * Register a keyboard shortcut from a React component.
 *
 * @param id     Stable unique identifier (e.g. "inspector.toggle"). Prevents duplicate registrations.
 * @param keys   Shortcut string (e.g. "Ctrl+Alt+I").
 * @param handler Function to call when the shortcut fires.
 * @param context Optional context name. If provided, shortcut only fires when that context is active.
 *
 * @example
 * useShortcut("inspector.toggle", "Ctrl+Alt+I", () => setVisibility(!isVisible));
 * useShortcut("canvas.delete", "Delete", handleDelete, "canvas-active");
 */
export function useShortcut(
    id: string,
    keys: string,
    handler: () => void,
    context?: string,
) {
    useEffect(() => {
        shortcutRegistry.set(id, {
            parsed: parseShortcut(keys),
            handler,
            context,
        });

        return () => {
            shortcutRegistry.delete(id);
        };
    }, [id, keys, handler, context]);
}
