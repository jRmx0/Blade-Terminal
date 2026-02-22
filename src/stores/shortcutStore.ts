import { create } from "zustand";

interface ShortcutState {
  activeContexts: string[];
  activateContext: (context: string) => void;
  deactivateContext: (context: string) => void;
}

export const useShortcutStore = create<ShortcutState>((set) => ({
  activeContexts: [],

  activateContext: (context) =>
    set((state) => ({
      activeContexts: state.activeContexts.includes(context)
        ? state.activeContexts
        : [...state.activeContexts, context],
    })),

  deactivateContext: (context) =>
    set((state) => ({
      activeContexts: state.activeContexts.filter((c) => c !== context),
    })),
}));
