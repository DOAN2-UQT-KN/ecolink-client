"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TableCell,
  TableRow as BaseTableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";
import type {
  DataTableColumn,
  DataTableInlineEdit,
  RowKey,
} from "./types";

type Props<T> = {
  columns: DataTableColumn<T>[];
  record: T;
  rowIndex: number;
  rowId: RowKey;
  selected: boolean;
  showSelection: boolean;
  canSelect: boolean;
  canEdit: (column: DataTableColumn<T>, row: T) => boolean;
  inlineEdit?: DataTableInlineEdit<T>;
  onSelect: (checked: boolean) => void;
  onRowClick?: (row: T) => void;
};

export function DataTableRow<T>({
  columns,
  record,
  rowIndex,
  rowId,
  selected,
  showSelection,
  canSelect,
  canEdit,
  inlineEdit,
  onSelect,
  onRowClick,
}: Props<T>) {
  const [editingColumnKey, setEditingColumnKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState<unknown>(null);

  const cellValues = useMemo(
    () =>
      columns.map((column) =>
        column.dataIndex ? (record[column.dataIndex] as unknown) : record,
      ),
    [columns, record],
  );

  return (
    <BaseTableRow
      className={cn(
        "hover:bg-muted/50",
        onRowClick && "cursor-pointer",
        selected && "data-[state=selected]:bg-muted",
      )}
      data-state={selected ? "selected" : undefined}
      onClick={() => onRowClick?.(record)}
    >
      {showSelection && (
        <TableCell className="px-3">
          <Checkbox
            checked={selected}
            disabled={!canSelect}
            onCheckedChange={(checked) => onSelect(Boolean(checked))}
            aria-label={`Select row ${rowId}`}
            onClick={(event) => event.stopPropagation()}
          />
        </TableCell>
      )}
      {columns.map((column, index) => {
        const value = cellValues[index];
        const editable = canEdit(column, record);
        const isEditing = editingColumnKey === column.key;

        const startEdit = () => {
          if (!editable) return;
          setEditingColumnKey(column.key);
          setDraftValue(value);
          inlineEdit?.onStartEdit?.(rowId, column.key, record);
        };

        const cancelEdit = () => {
          setEditingColumnKey(null);
          setDraftValue(null);
          inlineEdit?.onCancelEdit?.(rowId, column.key, record);
        };

        const save = async (nextValue: unknown) => {
          await inlineEdit?.onSave({
            rowKey: rowId,
            columnKey: column.key,
            value: nextValue,
            record,
          });
          setEditingColumnKey(null);
          setDraftValue(null);
        };

        return (
          <TableCell
            key={column.key}
            className={cn("px-3 py-2 text-sm", column.className)}
            onDoubleClick={(event) => {
              event.stopPropagation();
              startEdit();
            }}
          >
            {isEditing && inlineEdit ? (
              <div className="flex items-center gap-2">
                {column.renderEditor ? (
                  column.renderEditor({
                    value: draftValue,
                    record,
                    onSave: save,
                    onCancel: cancelEdit,
                  })
                ) : (
                  <>
                    <Input
                      value={`${draftValue ?? ""}`}
                      onChange={(event) => setDraftValue(event.target.value)}
                      className="h-8"
                    />
                    <button
                      type="button"
                      className="text-xs text-primary cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation();
                        void save(draftValue);
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation();
                        cancelEdit();
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            ) : column.render ? (
              column.render(value, record, rowIndex)
            ) : (
              (value as React.ReactNode)
            )}
          </TableCell>
        );
      })}
    </BaseTableRow>
  );
}
