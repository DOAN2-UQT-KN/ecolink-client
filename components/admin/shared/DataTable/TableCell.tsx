"use client";

import { useMemo } from "react";
import { TableCell as BaseTableCell } from "@/components/ui/table";
import { cn } from "@/libs/utils";
import type { DataTableColumn } from "./types";

type Props<T> = {
  column: DataTableColumn<T>;
  record: T;
  rowIndex: number;
  theme?: "light" | "dark";
};

export function TableCell<T>({ column, record, rowIndex, theme = "dark" }: Props<T>) {
  const value = useMemo(
    () => (column.dataIndex ? (record[column.dataIndex] as unknown) : record),
    [column.dataIndex, record],
  );

  return (
    <BaseTableCell
      className={cn(
        "px-3 py-2.5 font-display-1",
        theme === "dark" ? "text-zinc-100" : "text-zinc-900",
        column.className,
      )}
    >
      {column.render ? column.render(value, record, rowIndex) : (value as React.ReactNode)}
    </BaseTableCell>
  );
}
