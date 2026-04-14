"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/libs/utils";
import { DataTableHeader } from "./TableHeader";
import { DataTableRow } from "./TableRow";
import { useSelection } from "./hooks/useSelection";
import { useSorting } from "./hooks/useSorting";
import { useTableState } from "./hooks/useTableState";
import type {
  DataTableFilterConfig,
  DataTableProps,
  FilterValue,
  RowKey,
} from "./types";

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

function normalizeText(value: unknown) {
  return `${value ?? ""}`.toLowerCase().trim();
}

function matchesFilter(value: unknown, filterValue: FilterValue, type: DataTableFilterConfig["type"]) {
  if (type === "text") return normalizeText(value).includes(normalizeText(filterValue));
  if (type === "select") {
    const list = Array.isArray(filterValue) ? filterValue : [String(filterValue)];
    if (list.length === 0 || list[0] === "") return true;
    return list.includes(String(value ?? ""));
  }
  if (type === "dateRange") {
    if (!filterValue || typeof filterValue !== "object" || Array.isArray(filterValue)) return true;
    const dateValue = value ? new Date(String(value)).getTime() : NaN;
    if (Number.isNaN(dateValue)) return false;
    const from = filterValue.from ? new Date(filterValue.from).getTime() : null;
    const to = filterValue.to ? new Date(filterValue.to).getTime() : null;
    if (from && dateValue < from) return false;
    if (to && dateValue > to) return false;
    return true;
  }

  return true;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  error,
  onRetry,
  rowKey,
  className,
  emptyTitle = "No data",
  emptyDescription,
  emptyAction,
  stickyHeader = true,
  pageSizes = DEFAULT_PAGE_SIZES,
  loadingRowCount = 8,
  search,
  filters,
  sorting,
  pagination,
  rowSelection,
  inlineEdit,
  permission,
  virtualization,
  infiniteScroll,
  onRowClick,
}: DataTableProps<T>) {
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const [virtualScrollTop, setVirtualScrollTop] = useState(0);

  const { search: searchValue, filters: filterValues, updateFilters, updateSearch } = useTableState({
    externalSearch: search?.value ?? "",
    onSearchChange: search?.onChange,
    debounceMs: search?.debounceMs,
    initialFilters: filters?.values ?? {},
    onFilterChange: filters?.onChange,
  });
  const filterConfig = filters?.config;

  const getRowKey = (record: T, index: number): RowKey => {
    if (typeof rowKey === "function") return rowKey(record, index);
    if (rowKey) return String(record[rowKey] as string | number);
    return String(index);
  };

  const canSelectRecord = (record: T) => {
    if (permission?.role === "staff" && permission.canSelect === undefined) return false;
    const permissionCanSelect =
      typeof permission?.canSelect === "function"
        ? permission.canSelect(record)
        : permission?.canSelect;
    const selectionCanSelect =
      typeof rowSelection?.canSelect === "function"
        ? rowSelection.canSelect(record)
        : rowSelection?.canSelect;

    return (permissionCanSelect ?? true) && (selectionCanSelect ?? true);
  };

  const canEditRecord = (record: T, columnEditable?: boolean | ((record: T) => boolean)) => {
    if (!inlineEdit) return false;
    if (permission?.role === "staff" && permission.canEdit === undefined) return false;
    const permissionCanEdit =
      typeof permission?.canEdit === "function" ? permission.canEdit(record) : permission?.canEdit;
    const columnCanEdit = typeof columnEditable === "function" ? columnEditable(record) : columnEditable;
    return (permissionCanEdit ?? true) && (columnCanEdit ?? false);
  };

  const filteredData = useMemo(() => {
    return data.filter((record) => {
      const searchOk =
        !searchValue ||
        columns.some((column) => {
          if (!column.filterable) return false;
          const value = column.dataIndex ? record[column.dataIndex] : record;
          return normalizeText(value).includes(normalizeText(searchValue));
        });

      if (!searchOk) return false;
      if (!filterConfig?.length) return true;

      return filterConfig.every((filterConfig) => {
        const rawValue = filterValues[filterConfig.key];
        if (rawValue === undefined || rawValue === "" || (Array.isArray(rawValue) && rawValue.length === 0)) {
          return true;
        }

        const relatedColumn = columns.find((column) => column.key === filterConfig.key);
        if (!relatedColumn) return true;
        const value = relatedColumn.dataIndex ? record[relatedColumn.dataIndex] : record;
        return matchesFilter(value, rawValue, filterConfig.type);
      });
    });
  }, [columns, data, filterConfig, filterValues, searchValue]);

  const sortedData = useSorting({
    data: filteredData,
    columns,
    mode: sorting?.mode ?? "server",
    sortKey: sorting?.sortKey,
    sortOrder: sorting?.sortOrder,
    comparator: sorting?.comparator,
  });

  const { selectableKeys, allSelected, partiallySelected } = useSelection({
    rows: sortedData,
    selectedRowKeys: rowSelection?.selectedRowKeys ?? [],
    getRowKey,
    canSelectRecord,
  });

  const visibleData = useMemo(() => {
    if (!virtualization?.enabled) return sortedData;
    const height = virtualization.height ?? 420;
    const rowHeight = virtualization.rowHeight ?? 48;
    const overscan = virtualization.overscan ?? 5;

    const start = Math.max(0, Math.floor(virtualScrollTop / rowHeight) - overscan);
    const count = Math.ceil(height / rowHeight) + overscan * 2;
    const end = Math.min(sortedData.length, start + count);
    return sortedData.slice(start, end);
  }, [sortedData, virtualScrollTop, virtualization]);

  const virtualPadding = useMemo(() => {
    if (!virtualization?.enabled) return { top: 0, bottom: 0, start: 0 };
    const rowHeight = virtualization.rowHeight ?? 48;
    const overscan = virtualization.overscan ?? 5;
    const start = Math.max(0, Math.floor(virtualScrollTop / rowHeight) - overscan);
    const end = start + visibleData.length;
    return {
      top: start * rowHeight,
      bottom: Math.max(0, (sortedData.length - end) * rowHeight),
      start,
    };
  }, [sortedData.length, visibleData.length, virtualScrollTop, virtualization]);

  useEffect(() => {
    const el = bodyContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (virtualization?.enabled) setVirtualScrollTop(el.scrollTop);
      if (
        infiniteScroll?.enabled &&
        infiniteScroll.hasMore &&
        !infiniteScroll.loadingMore &&
        infiniteScroll.onLoadMore
      ) {
        const threshold = infiniteScroll.threshold ?? 140;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
        if (isNearBottom) infiniteScroll.onLoadMore();
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [infiniteScroll, virtualization?.enabled]);

  const renderFilterInput = (key: string, value: FilterValue, filterType: DataTableFilterConfig["type"]) => {
    if (filterType === "text") {
      return (
        <Input
          value={String(value ?? "")}
          onChange={(event) => updateFilters({ ...filterValues, [key]: event.target.value })}
          className="h-9"
        />
      );
    }

    if (filterType === "select") {
      return null;
    }

    const dateValue =
      value && typeof value === "object" && !Array.isArray(value) ? value : { from: "", to: "" };

    return (
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={dateValue.from ?? ""}
          onChange={(event) => updateFilters({ ...filterValues, [key]: { ...dateValue, from: event.target.value } })}
          className="h-9"
        />
        <Input
          type="date"
          value={dateValue.to ?? ""}
          onChange={(event) => updateFilters({ ...filterValues, [key]: { ...dateValue, to: event.target.value } })}
          className="h-9"
        />
      </div>
    );
  };

  const onToggleAll = (checked: boolean) => {
    if (!rowSelection) return;
    if (!checked) {
      rowSelection.onChange([], []);
      return;
    }
    const selectedRows = sortedData.filter((record, index) =>
      selectableKeys.includes(getRowKey(record, index)),
    );
    rowSelection.onChange(selectableKeys, selectedRows);
  };

  const canSelectAny = selectableKeys.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {(search || filters) && (
        <div className="rounded-md border border-zinc-700/60 p-3 space-y-3 bg-zinc-900/50 backdrop-blur-sm">
          {search && (
            <Input
              value={searchValue}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder={search.placeholder ?? "Search..."}
              className="h-10 bg-zinc-800/80 border-zinc-700 placeholder:text-zinc-500 text-zinc-100 focus-visible:ring-zinc-500"
            />
          )}
          {filterConfig?.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filterConfig.map((filterConfig) => (
                <div key={filterConfig.key} className="space-y-1">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{filterConfig.label}</p>
                  {filterConfig.type === "select" ? (
                    <Select
                      value={String(filterValues[filterConfig.key] ?? "")}
                      onValueChange={(value) =>
                        updateFilters({
                          ...filterValues,
                          [filterConfig.key]: value,
                        })
                      }
                    >
                      <SelectTrigger className="h-9 w-full bg-zinc-800/80 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder={filterConfig.placeholder ?? "Select value"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        {filterConfig.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    renderFilterInput(
                      filterConfig.key,
                      filterValues[filterConfig.key] ?? "",
                      filterConfig.type,
                    )
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {rowSelection && rowSelection.selectedRowKeys.length > 0 && rowSelection.bulkActions && (
        <div className="rounded-md border border-zinc-600 bg-zinc-800/70 p-3 backdrop-blur-sm">{rowSelection.bulkActions}</div>
      )}

      <div className="rounded-md border border-zinc-700/70 bg-zinc-900 overflow-hidden">
        <div
          ref={bodyContainerRef}
          className={cn("w-full overflow-auto", virtualization?.enabled && "max-h-[420px]")}
          style={virtualization?.enabled ? { height: virtualization.height ?? 420 } : undefined}
        >
          <Table>
            <DataTableHeader
              columns={columns}
              showSelection={Boolean(rowSelection)}
              allSelected={allSelected}
              partiallySelected={partiallySelected}
              canSelectAny={canSelectAny}
              sortKey={sorting?.sortKey}
              sortOrder={sorting?.sortOrder ?? null}
              onSortChange={sorting?.onSortChange}
              onToggleAll={onToggleAll}
              stickyHeader={stickyHeader}
            />
            <TableBody>
              {loading ? (
                Array.from({ length: loadingRowCount }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell colSpan={columns.length + (rowSelection ? 1 : 0)}>
                      <Skeleton className="h-7 w-full bg-zinc-800" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (rowSelection ? 1 : 0)} className="h-56">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="rounded-full bg-zinc-800 p-3">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                      </div>
                      <p className="text-sm font-medium text-zinc-300">{error}</p>
                      {onRetry && (
                        <Button variant="outline" size="sm" onClick={onRetry} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                          Retry
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (rowSelection ? 1 : 0)} className="h-56">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="rounded-full bg-zinc-800 p-3">
                        <Inbox className="h-6 w-6 text-zinc-500" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-300">{emptyTitle}</p>
                      {emptyDescription && <p className="text-sm text-zinc-500">{emptyDescription}</p>}
                      {emptyAction}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {virtualization?.enabled && virtualPadding.top > 0 && (
                    <TableRow aria-hidden>
                      <TableCell
                        colSpan={columns.length + (rowSelection ? 1 : 0)}
                        style={{ height: `${virtualPadding.top}px`, padding: 0 }}
                      />
                    </TableRow>
                  )}
                  {visibleData.map((record, index) => {
                    const absoluteIndex = virtualPadding.start + index;
                    const key = getRowKey(record, absoluteIndex);
                    const selected = rowSelection?.selectedRowKeys.includes(key) ?? false;

                    return (
                      <DataTableRow
                        key={key}
                        columns={columns}
                        record={record}
                        rowIndex={absoluteIndex}
                        rowId={key}
                        selected={selected}
                        showSelection={Boolean(rowSelection)}
                        canSelect={canSelectRecord(record)}
                        canEdit={(column, row) => canEditRecord(row, column.editable)}
                        inlineEdit={inlineEdit}
                        onSelect={(checked) => {
                          if (!rowSelection) return;
                          const nextKeys = checked
                            ? [...new Set([...rowSelection.selectedRowKeys, key])]
                            : rowSelection.selectedRowKeys.filter((item) => item !== key);
                          const selectedRows = sortedData.filter((rowItem, rowIndex) =>
                            nextKeys.includes(getRowKey(rowItem, rowIndex)),
                          );
                          rowSelection.onChange(nextKeys, selectedRows);
                        }}
                        onRowClick={onRowClick}
                      />
                    );
                  })}
                  {virtualization?.enabled && virtualPadding.bottom > 0 && (
                    <TableRow aria-hidden>
                      <TableCell
                        colSpan={columns.length + (rowSelection ? 1 : 0)}
                        style={{ height: `${virtualPadding.bottom}px`, padding: 0 }}
                      />
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {infiniteScroll?.enabled && infiniteScroll.loadingMore && (
          <div className="flex items-center justify-center gap-2 border-t border-zinc-700/60 py-3 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more...
          </div>
        )}

        {pagination && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-700/60 p-3">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="text-zinc-400">Page size</span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) => pagination.onPageSizeChange?.(Number(value))}
              >
                <SelectTrigger className="h-8 w-[90px] bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizes.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {pagination.mode === "cursor" ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pagination.onPrevPage?.()}
                  disabled={!pagination.hasPrevPage || loading}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pagination.onNextPage?.()}
                  disabled={!pagination.hasNextPage || loading}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
                >
                  Next
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pagination.onPageChange?.(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page <= 1 || loading}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
                >
                  Previous
                </Button>
                <span className="text-sm text-zinc-300">
                  Page {pagination.page}
                  {typeof pagination.total === "number"
                    ? ` / ${Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}`
                    : ""}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pagination.onPageChange?.(pagination.page + 1)}
                  disabled={
                    loading ||
                    (typeof pagination.total === "number" &&
                      pagination.page >= Math.ceil(pagination.total / pagination.pageSize))
                  }
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
