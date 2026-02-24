interface ShortcutDisplayConfig {
    /** Display tokens shown in MenuBarItem (e.g. ["Ctrl", "Alt", "C"]) */
    shortcut: string[];
}

interface ShortcutBindingConfig extends ShortcutDisplayConfig {
    /** Shortcut string consumed by useShortcut / parseShortcut (e.g. "Ctrl+Alt+C") */
    keys: string;
}

export type WorkbenchShortcutConfig = ShortcutDisplayConfig | ShortcutBindingConfig;

export const WORKBENCH_SHORTCUTS = {
    "controls.toggle": {
        keys: "Ctrl+Alt+C",
        shortcut: ["Ctrl", "Alt", "C"],
    } satisfies ShortcutBindingConfig,
    "inspector.toggle": {
        keys: "Ctrl+Alt+I",
        shortcut: ["Ctrl", "Alt", "I"],
    } satisfies ShortcutBindingConfig,
    "canvas.zoom-in": {
        shortcut: ["Alt", "Scroll Up"],
    } satisfies ShortcutDisplayConfig,
    "canvas.zoom-out": {
        shortcut: ["Alt", "Scroll Down"],
    } satisfies ShortcutDisplayConfig,
    "canvas.reset-view": {
        keys: "Ctrl+Shift+H",
        shortcut: ["Ctrl", "Shift", "H"],
    } satisfies ShortcutBindingConfig,
};
