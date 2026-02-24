export interface WorkbenchShortcutConfig {
    /** Shortcut string consumed by useShortcut / parseShortcut (e.g. "Ctrl+Alt+C"). Omit if there's no keyboard binding. */
    keys?: string;
    /** Display tokens shown in MenuBarItem (e.g. ["Ctrl", "Alt", "C"]) */
    shortcut: string[];
}

export const WORKBENCH_SHORTCUTS = {
    "controls.toggle": {
        keys: "Ctrl+Alt+C",
        shortcut: ["Ctrl", "Alt", "C"],
    },
    "inspector.toggle": {
        keys: "Ctrl+Alt+I",
        shortcut: ["Ctrl", "Alt", "I"],
    },
    "canvas.zoom-in": {
        shortcut: ["Alt", "Scroll Up"],
    },
    "canvas.zoom-out": {
        shortcut: ["Alt", "Scroll Down"],
    },
    "canvas.reset-view": {
        keys: "Ctrl+Shift+H",
        shortcut: ["Ctrl", "Shift", "H"],
    },
} satisfies Record<string, WorkbenchShortcutConfig>;
