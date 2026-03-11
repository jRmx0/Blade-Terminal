import { useEffect, useRef } from "react";
import { useSaveModeStore } from "@/stores/saveModeStore";

const AUTOSAVE_DELAY_MS = 1000;

interface UseComputationProviderAutosaveProps {
    isOpen: boolean;
    isEditMode: boolean;
    isDirty: boolean;
    canSave: boolean;
    editingId: number | null;
    isSaving: boolean;
    onAutosave: () => Promise<boolean>;
}

export function useComputationProviderAutosave({
    isOpen,
    isEditMode,
    isDirty,
    canSave,
    editingId,
    isSaving,
    onAutosave,
}: UseComputationProviderAutosaveProps) {
    const isAutoSaveEnabled = useSaveModeStore((s) => s.isAutoSaveEnabled);
    const previousIsEditModeRef = useRef(isEditMode);

    useEffect(() => {
        const wasEditMode = previousIsEditModeRef.current;
        previousIsEditModeRef.current = isEditMode;

        const canAutosave = isOpen
            && isAutoSaveEnabled
            && isDirty
            && canSave
            && editingId !== null
            && !isSaving;

        if (canAutosave && wasEditMode && !isEditMode) {
            onAutosave().catch(console.error);
            return;
        }

        if (!canAutosave || !isEditMode) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            onAutosave().catch(console.error);
        }, AUTOSAVE_DELAY_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [canSave, editingId, isAutoSaveEnabled, isDirty, isEditMode, isOpen, isSaving, onAutosave]);
}
