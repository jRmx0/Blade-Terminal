import type { ReactNode } from "react";

export type InternalCardModalListPartRowId = string | number;

export interface InternalCardModalListPartColumn {
    id: string;
    title: ReactNode;
    width?: number;
    minWidth?: number;
    editable?: boolean;
}

export interface InternalCardModalListPartCellEditor {
    type?: "text" | "number" | "password";
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    onConfirm?: () => void;
    onCancel?: () => void;
    disabled?: boolean;
}

export interface InternalCardModalListPartCell {
    value: ReactNode;
    title?: string;
    tone?: "default" | "muted" | "subtle";
    mono?: boolean;
    editable?: boolean;
    editor?: InternalCardModalListPartCellEditor;
    emptyValue?: ReactNode;
}

export interface InternalCardModalListPartRecordAction {
    id: string;
    icon: string;
    title: string;
    onClick: (rowId: InternalCardModalListPartRowId) => void | Promise<void>;
    variant?: "default" | "danger";
    disabled?: boolean;
}

export interface InternalCardModalListPartBaseRow {
    id: InternalCardModalListPartRowId;
    recordId?: ReactNode;
    selectable?: boolean;
}

export interface InternalCardModalListPartGroupRow extends InternalCardModalListPartBaseRow {
    kind: "group";
    label: ReactNode;
    expanded: boolean;
    onToggle: () => void;
    children: InternalCardModalListPartRow[];
}

export interface InternalCardModalListPartRecordRow extends InternalCardModalListPartBaseRow {
    kind: "record";
    cells: Record<string, InternalCardModalListPartCell | undefined>;
    actions?: InternalCardModalListPartRecordAction[];
}

export type InternalCardModalListPartRow =
    | InternalCardModalListPartGroupRow
    | InternalCardModalListPartRecordRow;

export interface InternalCardModalListPartNewResult {
    rowId: InternalCardModalListPartRowId;
    columnId?: string;
}

export interface InternalCardModalListPartTableActionContext {
    selectedRowIds: InternalCardModalListPartRowId[];
}

export interface InternalCardModalListPartTableAction {
    id: string;
    icon: string;
    label: string;
    onClick: (context: InternalCardModalListPartTableActionContext) => void | Promise<void>;
    variant?: "default" | "danger";
    disabled?: boolean;
}

export interface InternalCardModalListPartTableActions {
    onNew?: () => void | InternalCardModalListPartNewResult | Promise<void | InternalCardModalListPartNewResult>;
    newDisabled?: boolean;
    onDelete?: (selectedRowIds: InternalCardModalListPartRowId[]) => void | Promise<void>;
    deleteDisabled?: boolean;
    actions?: InternalCardModalListPartTableAction[];
}
