import type { InternalCardModalListPartRow, InternalCardModalListPartRowId } from "./types";

export interface FlattenedInternalCardModalListPartRow {
    row: InternalCardModalListPartRow;
    depth: number;
    parentIds: InternalCardModalListPartRowId[];
}

export function flattenInternalCardModalListPartRows(
    rows: InternalCardModalListPartRow[],
    depth = 0,
    parentIds: InternalCardModalListPartRowId[] = [],
): FlattenedInternalCardModalListPartRow[] {
    const flattenedRows: FlattenedInternalCardModalListPartRow[] = [];

    for (const row of rows) {
        flattenedRows.push({ row, depth, parentIds });

        if (row.kind === "group" && row.expanded) {
            flattenedRows.push(
                ...flattenInternalCardModalListPartRows(row.children, depth + 1, [...parentIds, row.id]),
            );
        }
    }

    return flattenedRows;
}
