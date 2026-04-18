"use client";

import type { ReactNode } from "react";

export type SortOrder = "asc" | "desc" | null;
export type TablePermissionRole = "admin" | "staff";

export type RowKey = string;

export type DataTableColumn<T> = {
  key: string;
  title: ReactNode;
  dataIndex?: keyof T;
  width?: number | string;
  className?: string;
  sticky?: "left" | "right";
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean | ((record: T) => boolean);
  sortValue?: (record: T) => string | number | Date | null | undefined;
  render?: (value: unknown, record: T, index: number) => ReactNode;
  renderEditor?: (params: {
    value: unknown;
    record: T;
    onSave: (nextValue: unknown) => void;
    onCancel: () => void;
  }) => ReactNode;
};

export type DataTablePagination = {
  mode?: "page" | "cursor";
  page: number;
  pageSize: number;
  total?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
};

export type FilterType = "text" | "select" | "dateRange";

export type DataTableFilterOption = {
  label: string;
  value: string;
};

export type DataTableFilterConfig = {
  key: string;
  label: string;
  type: FilterType;
  options?: DataTableFilterOption[];
  placeholder?: string;
};

export type FilterValue = string | string[] | { from?: string; to?: string };
export type FilterState = Record<string, FilterValue>;

export type DataTableSelection<T> = {
  selectedRowKeys: RowKey[];
  onChange: (keys: RowKey[], rows: T[]) => void;
  canSelect?: boolean | ((record: T) => boolean);
  bulkActions?: ReactNode;
};

export type DataTablePermission<T> = {
  role: TablePermissionRole;
  canEdit?: boolean | ((record: T) => boolean);
  canSelect?: boolean | ((record: T) => boolean);
};

export type DataTableInlineEdit<T> = {
  onSave: (params: {
    rowKey: RowKey;
    columnKey: string;
    value: unknown;
    record: T;
  }) => Promise<void> | void;
  onStartEdit?: (rowKey: RowKey, columnKey: string, record: T) => void;
  onCancelEdit?: (rowKey: RowKey, columnKey: string, record: T) => void;
};

export type DataTableSorting<T> = {
  mode?: "client" | "server";
  sortKey?: string | null;
  sortOrder?: SortOrder;
  onSortChange?: (key: string, order: SortOrder) => void;
  comparator?: (a: T, b: T, key: string, order: Exclude<SortOrder, null>) => number;
};

export type DataTableInfiniteScroll = {
  enabled?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  threshold?: number;
};

export type DataTableVirtualization = {
  enabled?: boolean;
  height?: number;
  rowHeight?: number;
  overscan?: number;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  rowKey?: keyof T | ((record: T, index: number) => RowKey);
  className?: string;
  /** Override the color theme. Defaults to the AdminLayoutContext theme ("dark" if not inside admin). */
  theme?: "light" | "dark";
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  stickyHeader?: boolean;
  pageSizes?: number[];
  loadingRowCount?: number;

  search?: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
  };
  filters?: {
    config: DataTableFilterConfig[];
    values: FilterState;
    onChange: (values: FilterState) => void;
  };
  sorting?: DataTableSorting<T>;
  pagination?: DataTablePagination;
  rowSelection?: DataTableSelection<T>;
  inlineEdit?: DataTableInlineEdit<T>;
  permission?: DataTablePermission<T>;
  virtualization?: DataTableVirtualization;
  infiniteScroll?: DataTableInfiniteScroll;

  onRowClick?: (row: T) => void;
};
