"use client";

import { useMemo } from "react";
import type { DataTableColumn, SortOrder } from "../types";

const defaultComparator = <T,>(
  a: T,
  b: T,
  key: string,
  order: Exclude<SortOrder, null>,
  columns: DataTableColumn<T>[],
): number => {
  const column = columns.find((item) => item.key === key);
  const aValue = column?.sortValue
    ? column.sortValue(a)
    : column?.dataIndex
      ? (a[column.dataIndex] as unknown)
      : undefined;
  const bValue = column?.sortValue
    ? column.sortValue(b)
    : column?.dataIndex
      ? (b[column.dataIndex] as unknown)
      : undefined;

  const aComparable = aValue instanceof Date ? aValue.getTime() : `${aValue ?? ""}`;
  const bComparable = bValue instanceof Date ? bValue.getTime() : `${bValue ?? ""}`;

  if (aComparable < bComparable) return order === "asc" ? -1 : 1;
  if (aComparable > bComparable) return order === "asc" ? 1 : -1;
  return 0;
};

type UseSortingParams<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  mode: "client" | "server";
  sortKey?: string | null;
  sortOrder?: SortOrder;
  comparator?: (a: T, b: T, key: string, order: Exclude<SortOrder, null>) => number;
};

export const useSorting = <T,>({
  data,
  columns,
  mode,
  sortKey,
  sortOrder,
  comparator,
}: UseSortingParams<T>): T[] =>
  useMemo(() => {
    if (mode === "server" || !sortKey || !sortOrder) return data;

    const internalComparator =
      comparator ??
      ((a: T, b: T, key: string, order: Exclude<SortOrder, null>) =>
        defaultComparator(a, b, key, order, columns));

    return [...data].sort((a, b) => internalComparator(a, b, sortKey, sortOrder));
  }, [columns, comparator, data, mode, sortKey, sortOrder]);
