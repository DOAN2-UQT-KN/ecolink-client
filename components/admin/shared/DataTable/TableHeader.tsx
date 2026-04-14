"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TableHead,
  TableHeader as BaseTableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/libs/utils";
import type { DataTableColumn, SortOrder } from "./types";

type Props<T> = {
  columns: DataTableColumn<T>[];
  showSelection: boolean;
  allSelected: boolean;
  partiallySelected: boolean;
  canSelectAny: boolean;
  sortKey?: string | null;
  sortOrder?: SortOrder;
  onToggleAll: (checked: boolean) => void;
  onSortChange?: (key: string, order: SortOrder) => void;
  stickyHeader?: boolean;
};

export function DataTableHeader<T>({
  columns,
  showSelection,
  allSelected,
  partiallySelected,
  canSelectAny,
  sortKey,
  sortOrder,
  onToggleAll,
  onSortChange,
  stickyHeader,
}: Props<T>) {
  return (
    <BaseTableHeader className={cn(stickyHeader && "sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-700/60")}>
      <TableRow className="bg-zinc-900 hover:bg-zinc-900 border-b border-zinc-700/60">
        {showSelection && (
          <TableHead className="w-12 px-3">
            <Checkbox
              checked={allSelected || (partiallySelected ? "indeterminate" : false)}
              disabled={!canSelectAny}
              onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
              aria-label="Select all rows"
            />
          </TableHead>
        )}
        {columns.map((column) => {
          const active = sortKey === column.key;
          const nextOrder: SortOrder =
            !active ? "asc" : sortOrder === "asc" ? "desc" : sortOrder === "desc" ? null : "asc";

          return (
            <TableHead
              key={column.key}
              className={cn("px-3 py-2.5 font-semibold text-zinc-300 text-xs uppercase tracking-wide", column.className)}
              style={{ width: column.width }}
            >
              {column.sortable ? (
                <button
                  type="button"
                  onClick={() => onSortChange?.(column.key, nextOrder)}
                  className="inline-flex items-center gap-1 hover:text-zinc-100 transition-colors cursor-pointer text-zinc-300"
                >
                  {column.title}
                  {active ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : sortOrder === "desc" ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="h-4 w-4 text-zinc-600" />
                  )}
                </button>
              ) : (
                column.title
              )}
            </TableHead>
          );
        })}
      </TableRow>
    </BaseTableHeader>
  );
}
