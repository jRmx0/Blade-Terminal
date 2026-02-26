import type { ShortcutBindingConfig, ShortcutDisplayConfig } from "@/types/shortcutTypes";

export type { ShortcutBindingConfig, ShortcutDisplayConfig };

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
    "canvas.tool-select": {
        keys: "Ctrl+S",
        shortcut: ["Ctrl", "E"],
    } satisfies ShortcutBindingConfig,
    "canvas.tool-add-zone": {
        keys: "Ctrl+Z",
        shortcut: ["Ctrl", "Z"],
    } satisfies ShortcutBindingConfig,
    "canvas.tool-add-obstacle": {
        keys: "Ctrl+O",
        shortcut: ["Ctrl", "O"],
    } satisfies ShortcutBindingConfig,
    "canvas.tool-delete": {
        keys: "Ctrl+D",
        shortcut: ["Ctrl", "D"],
    } satisfies ShortcutBindingConfig,
    "canvas.undo": {
        keys: "Ctrl+Z",
        shortcut: ["Ctrl", "Z"],
    } satisfies ShortcutBindingConfig,
    "canvas.redo": {
        keys: "Ctrl+Y",
        shortcut: ["Ctrl", "Y"],
    } satisfies ShortcutBindingConfig,
};
