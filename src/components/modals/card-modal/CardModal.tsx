import { useEffect, type ReactNode } from "react";
import ModalActionBar, { type ModalActionBarItem } from "@/components/modal/modal-action-bar/ModalActionBar";
import ModalTitle from "@/components/modal/modal-title/ModalTitle";
import InternalCardModalHeader, { type InternalCardModalSavedState } from "./internal/InternalCardModalHeader";
import InternalCardModalFastTab from "./internal/InternalCardModalFastTab";
import InternalCardModalFastTabField, { type InternalCardModalTextFieldHintState } from "./internal/InternalCardModalFastTabField";
import InternalCardModalListPart from "./internal/InternalCardModalListPart";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";

export type CardModalSavedState = InternalCardModalSavedState;

interface CardModalHeaderConfig {
    recordId: number | null;
    recordName: string;
    savedState: CardModalSavedState;
    onSave: () => void;
    canSave?: boolean;
    isEditMode: boolean;
    onEdit: () => void;
    onNew: () => void;
    onDelete: () => void;
    canDelete?: boolean;
}

interface CardModalFieldConfig {
    id: string;
    label: string;
    value: string;
    placeholder?: string;
    type?: "text" | "password";
    required?: boolean;
    disabled?: boolean;
    hint?: string;
    hintState?: InternalCardModalTextFieldHintState;
    onChange?: (value: string) => void;
    onConfirm?: () => void;
}

interface CardModalFastTabConfig {
    id: string;
    title: string;
    expanded: boolean;
    onToggle: () => void;
    disabled?: boolean;
    fields?: CardModalFieldConfig[];
    content?: ReactNode;
}

interface CardModalSectionConfig {
    id: string;
    title: string;
    badge?: ReactNode;
    content: ReactNode;
}

interface CardModalProps {
    isOpen: boolean;
    title: string;
    shortcutToken: string;
    onClose: () => void;
    header?: CardModalHeaderConfig;
    actionBarActions?: ModalActionBarItem[];
    fastTabs?: CardModalFastTabConfig[];
    sections?: CardModalSectionConfig[];
    children?: ReactNode;
    widthClassName?: string;
    bodyClassName?: string;
    canCloseOnEscape?: boolean;
}

export default function CardModal({
    isOpen,
    title,
    shortcutToken,
    onClose,
    header,
    actionBarActions = [],
    fastTabs = [],
    sections = [],
    children,
    widthClassName = "w-180",
    bodyClassName = "flex flex-col flex-1 overflow-y-auto p-4 gap-3",
    canCloseOnEscape = true,
}: CardModalProps) {
    useShortcutsBlocked(shortcutToken, isOpen);

    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && canCloseOnEscape) {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, canCloseOnEscape]);

    if (!isOpen) return null;

    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropClick}
        >
            <div className={`flex flex-col ${widthClassName} max-h-[90vh] bg-gray-100 rounded-lg shadow-xl overflow-visible`}>
                <ModalTitle title={title} onClose={onClose} />
                {header ? <InternalCardModalHeader {...header} /> : null}
                <ModalActionBar actions={actionBarActions} />
                <div className={bodyClassName}>
                    {fastTabs.map((fastTab) => (
                        <InternalCardModalFastTab
                            key={fastTab.id}
                            title={fastTab.title}
                            expanded={fastTab.expanded}
                            onToggle={fastTab.onToggle}
                            disabled={fastTab.disabled}
                        >
                            {fastTab.fields?.map((field) => (
                                <InternalCardModalFastTabField
                                    key={field.id}
                                    label={field.label}
                                    value={field.value}
                                    placeholder={field.placeholder}
                                    type={field.type}
                                    required={field.required}
                                    disabled={field.disabled}
                                    hint={field.hint}
                                    hintState={field.hintState}
                                    onChange={field.onChange}
                                    onConfirm={field.onConfirm}
                                />
                            ))}
                            {fastTab.content}
                        </InternalCardModalFastTab>
                    ))}
                    {sections.map((section) => (
                        <InternalCardModalListPart key={section.id} title={section.title} badge={section.badge}>
                            {section.content}
                        </InternalCardModalListPart>
                    ))}
                    {children}
                </div>
            </div>
        </div>
    );
}
