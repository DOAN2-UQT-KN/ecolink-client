"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/libs/utils";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export interface ColumnType<T> {
  title: React.ReactNode;
  dataIndex?: keyof T;
  key: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  className?: string;
  width?: string | number;
}

export interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
}

export interface DataTableProps<T> {
  columns: ColumnType<T>[];
  dataSource: T[];
  loading?: boolean;
  pagination?: PaginationProps | false;
  onChange?: (pagination: PaginationProps, filters: any) => void;
  filter?: React.ReactNode;
  className?: string;
  rowKey?: keyof T | ((record: T) => string | number);
  emptyText?: string;
  onRowClick?: (record: T) => void;
}

export function DataTable<T>({
  columns,
  dataSource,
  loading = false,
  pagination,
  onChange,
  filter,
  className,
  rowKey,
  emptyText,
  onRowClick,
}: DataTableProps<T>) {
  const { t } = useTranslation();

  const getRowKey = (record: T, index: number) => {
    if (typeof rowKey === "function") return rowKey(record);
    if (rowKey) return (record[rowKey] as unknown) as string;
    return index;
  };

  const handlePageChange = (newPage: number) => {
    if (pagination && onChange) {
      onChange({ ...pagination, current: newPage }, {});
    }
  };

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-[10px] border border-[#665814]/50 bg-card shadow-sm overflow-hidden flex flex-col">
        {/* 🔹 FILTER (HEADER) */}
        {filter && (
          <div className="px-4 py-3 border-b border-[#665814]/50 bg-white">
            {filter}
          </div>
        )}

        {/* 🔹 TABLE */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#887A47]/10">
              <TableRow className="!border-b !border-[#887A47]/50">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "h-12 px-4 display-1 font-semibold capitalize text-foreground-secondary font-display-1",
                      column.className,
                    )}
                    style={{ width: column.width }}
                  >
                    {typeof column.title === "string"
                      ? t(column.title)
                      : column.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="border-b border-[#887A47]/50">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-t border-[#887A47]/50">
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn("px-4 py-3", column.className)}
                      >
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : dataSource.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-72 text-center"
                  >
                    <Empty className="border-none">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Inbox className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle className="!font-display-2 font-semibold text-foreground-secondary">
                          {t("No data found")}
                        </EmptyTitle>
                        {emptyText && (
                          <EmptyDescription className="!font-display-1">
                            {emptyText}
                          </EmptyDescription>
                        )}
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                dataSource.map((record, index) => (
                  <TableRow
                    key={getRowKey(record, index)}
                    className="hover:bg-[#887A47]/5 border-t border-[#887A47]/50  cursor-pointer"
                    onClick={() => onRowClick?.(record)}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn("px-4 py-3 text-sm", column.className)}
                      >
                        {column.render
                          ? column.render(
                              column.dataIndex
                                ? record[column.dataIndex]
                                : record,
                              record,
                              index,
                            )
                          : column.dataIndex
                          ? (record[column.dataIndex] as React.ReactNode)
                          : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 🔹 PAGINATION (FOOTER) */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-[#887A47]/30 bg-white">
            <button
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={pagination.current <= 1 || loading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-[10px] border border-[#887A47]/50 text-button-accent hover:bg-[#887A47]/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("Back")}
            </button>

            <div className="hidden sm:flex items-center rounded-[8px] border border-[#887A47]/30 overflow-hidden bg-white">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const current = pagination.current;
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= current - 1 && page <= current + 1)
                  );
                })
                .map((page, index, array) => {
                  const isLast = index === array.length - 1;
                  const hasGap = index > 0 && array[index - 1] !== page - 1;

                  return (
                    <React.Fragment key={page}>
                      {hasGap && (
                        <div className="px-2 py-2 text-[#887A47]/60 border-r border-[#887A47]/30 bg-[#FBFBF8]">
                          ...
                        </div>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          "px-3  py-2 text-sm font-medium transition-all duration-200",
                          !isLast && "border-r border-[#887A47]/50",
                          pagination.current === page
                            ? "bg-[#887A47] text-white"
                            : "bg-white text-[#887A47] hover:bg-[#887A47]/5",
                        )}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.current + 1)}
              disabled={pagination.current >= totalPages || loading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium t-ransition-all duration-200 rounded-[10px] border border-[#887A47]/30 text-button-accent hover:bg-[#887A47]/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
              )}
            >
              {t("Next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
