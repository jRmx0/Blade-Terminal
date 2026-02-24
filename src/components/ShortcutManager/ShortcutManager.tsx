import { useEffect } from "react";
import { shortcutRegistry } from "@/hooks/shortcut-manager/useShortcut";
import { matchesShortcut } from "@/utils/parseShortcut";
import { useShortcutStore } from "@/stores/shortcutStore";
import { useMenuStore } from "@/stores/menuStore";

/**
 * Renderless component — mount once in the app shell.
 * Owns the single global keydown listener that dispatches to registered shortcuts.
 */
export default function ShortcutManager() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { activeContexts } = useShortcutStore.getState();

      for (const [, entry] of shortcutRegistry) {
        if (!matchesShortcut(e, entry.parsed)) continue;
        if (entry.context && !activeContexts.includes(entry.context)) continue;

        e.preventDefault();

        useMenuStore.getState().setActiveMenu(null);

        entry.handler();
        break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
