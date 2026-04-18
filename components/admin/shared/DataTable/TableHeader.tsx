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
  theme?: "light" | "dark";
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
  theme = "dark",
}: Props<T>) {
  const isDark = theme === "dark";

  return (
    <BaseTableHeader
      className={cn(
        stickyHeader && "sticky top-0 z-10 backdrop-blur-sm",
        stickyHeader && isDark
          ? "bg-zinc-950/95 border-b border-zinc-700/60"
          : stickyHeader && "bg-zinc-100 border-b border-gray-200",
      )}
    >
      <TableRow
        className={cn(
          isDark
            ? "bg-zinc-900 hover:bg-zinc-900 border-b border-zinc-700/60"
            : "bg-zinc-200 hover:bg-zinc-200 border-b border-gray-200",
        )}
      >
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
              className={cn(
                "px-3 py-2.5 font-semibold text-xs uppercase tracking-wide",
                isDark ? "text-zinc-300" : "text-zinc-700",
                column.className,
              )}
              style={{ width: column.width }}
            >
              {column.sortable ? (
                <button
                  type="button"
                  onClick={() => onSortChange?.(column.key, nextOrder)}
                  className={cn(
                    "inline-flex items-center gap-1 transition-colors cursor-pointer",
                    isDark
                      ? "text-zinc-300 hover:text-zinc-100"
                      : "text-black",
                  )}
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
                    <ArrowUpDown className={cn("h-4 w-4", isDark ? "text-zinc-600" : "text-black")} />
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
