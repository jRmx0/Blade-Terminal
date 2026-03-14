import { type ReactNode } from "react";
import ModalActionBar, { type ModalActionBarItem } from "@/components/modal/modal-action-bar/ModalActionBar";
import ModalTitle from "@/components/modal/modal-title/ModalTitle";
import InternalCardModalHeader, { type InternalCardModalSavedState } from "./internal/InternalCardModalHeader";
import InternalCardModalFastTab from "./internal/InternalCardModalFastTab";
import InternalCardModalFastTabField, { type InternalCardModalTextFieldHintState } from "./internal/InternalCardModalFastTabField";
import InternalCardModalListPart, {
    type InternalCardModalListPartColumn,
    type InternalCardModalListPartRow,
    type InternalCardModalListPartRowId,
    type InternalCardModalListPartTableActions,
} from "./internal/InternalCardModalListPart";
import { useModalLifecycle } from "../../../hooks/modals/useModalLifecycle";

export type CardModalSavedState = InternalCardModalSavedState;
export type CardModalListPartColumn = InternalCardModalListPartColumn;
export type CardModalListPartRow = InternalCardModalListPartRow;
export type CardModalListPartRowId = InternalCardModalListPartRowId;
export type CardModalListPartTableActions = InternalCardModalListPartTableActions;

export interface CardModalListPartConfig {
    title?: ReactNode;
    badge?: ReactNode;
    content?: ReactNode;
    columns?: InternalCardModalListPartColumn[];
    rows?: InternalCardModalListPartRow[];
    emptyMessage?: ReactNode;
    maxHeightClassName?: string;
    editable?: boolean;
    storageKey?: string;
    selectedRowIds?: InternalCardModalListPartRowId[];
    onSelectedRowIdsChange?: (nextSelectedRowIds: InternalCardModalListPartRowId[]) => void;
    tableActions?: InternalCardModalListPartTableActions;
}

export interface CardModalHeaderConfig {
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

export interface CardModalFieldConfig {
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

export interface CardModalFastTabConfig {
    id: string;
    title: string;
    expanded: boolean;
    onToggle: () => void;
    disabled?: boolean;
    fields?: CardModalFieldConfig[];
    listPart?: CardModalListPartConfig;
    content?: ReactNode;
}

export type CardModalSectionConfig = CardModalListPartConfig & {
    id: string;
    title: ReactNode;
};

export interface CardModalProps {
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
    widthClassName = "w-240",
    bodyClassName = "flex flex-col flex-1 min-h-0 overflow-y-auto p-4 gap-3",
    canCloseOnEscape = true,
}: CardModalProps) {
    const { handleBackdropMouseDown } = useModalLifecycle({
        isOpen,
        shortcutToken,
        onClose,
        canCloseOnEscape,
    });

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 select-none"
            onMouseDown={handleBackdropMouseDown}
        >
            <div className={`flex flex-col ${widthClassName} max-h-[90vh] min-h-0 bg-gray-100 rounded-lg shadow-xl overflow-hidden`}>
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
                            {fastTab.listPart ? (
                                <InternalCardModalListPart
                                    title={fastTab.listPart.title}
                                    badge={fastTab.listPart.badge}
                                    columns={fastTab.listPart.columns}
                                    rows={fastTab.listPart.rows}
                                    emptyMessage={fastTab.listPart.emptyMessage}
                                    maxHeightClassName={fastTab.listPart.maxHeightClassName}
                                    editable={fastTab.listPart.editable}
                                    storageKey={fastTab.listPart.storageKey}
                                    selectedRowIds={fastTab.listPart.selectedRowIds}
                                    onSelectedRowIdsChange={fastTab.listPart.onSelectedRowIdsChange}
                                    tableActions={fastTab.listPart.tableActions}
                                >
                                    {fastTab.listPart.content}
                                </InternalCardModalListPart>
                            ) : null}
                            {fastTab.content}
                        </InternalCardModalFastTab>
                    ))}
                    {sections.map((section) => (
                        <InternalCardModalListPart
                            key={section.id}
                            title={section.title}
                            badge={section.badge}
                            columns={section.columns}
                            rows={section.rows}
                            emptyMessage={section.emptyMessage}
                            maxHeightClassName={section.maxHeightClassName}
                            editable={section.editable}
                            storageKey={section.storageKey}
                            selectedRowIds={section.selectedRowIds}
                            onSelectedRowIdsChange={section.onSelectedRowIdsChange}
                            tableActions={section.tableActions}
                        >
                            {section.content}
                        </InternalCardModalListPart>
                    ))}
                    {children}
                </div>
            </div>
        </div>
    );
}
