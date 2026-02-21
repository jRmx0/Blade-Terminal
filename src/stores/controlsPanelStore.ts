import { create } from "zustand";
import type { ControlsPanelState, ControlsPanelSectionId } from "@/types/controlsPanelTypes";

export const useControlsPanelStore = create<ControlsPanelState>((set) => ({
    expandedSections: {
        general: true,
        algo: true,
        env: true,
        object: true,
        debug: false,
    },

    toggleSection: (sectionId: ControlsPanelSectionId) =>
        set((state) => ({
            expandedSections: {
                ...state.expandedSections,
                [sectionId]: !state.expandedSections[sectionId],
            },
        })),

    expandSection: (sectionId: ControlsPanelSectionId) =>
        set((state) => ({
            expandedSections: {
                ...state.expandedSections,
                [sectionId]: true,
            },
        })),

    collapseSection: (sectionId: ControlsPanelSectionId) =>
        set((state) => ({
            expandedSections: {
                ...state.expandedSections,
                [sectionId]: false,
            },
        })),
}));
