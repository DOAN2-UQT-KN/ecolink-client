"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { IGift } from "@/apis/gift/models/gift";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { DataTable as SharedDataTable, type DataTableColumn } from "@/components/admin/shared/DataTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { useGiftContext } from "../_context/GiftContext";

const COLUMN_KEYS = {
  NAME: "name",
  POINTS: "points",
  STOCK: "stock",
  ACTIVE: "active",
  MEDIA: "media",
  ACTION: "action",
} as const;

function shortId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function DataTable({ onEdit }: { onEdit: (gift: IGift) => void }) {
  const { t } = useTranslation();
  const { gifts, loading, pagination, total, onPageChange, onPageSizeChange } = useGiftContext();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";

  const columns: DataTableColumn<IGift>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NAME,
        title: t("Name"),
        className: "min-w-[160px]",
        render: (_, record) => (
          <div className="flex flex-col gap-0.5">
            <span className={cn("font-medium", isDark ? "text-zinc-100" : "text-zinc-900")}>
              {record.name}
            </span>
            <span
              className={cn(
                "line-clamp-2 text-xs",
                isDark ? "text-zinc-500" : "text-muted-foreground",
              )}
            >
              {record.description}
            </span>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.POINTS,
        title: t("Green points"),
        className: "w-[120px]",
        render: (_, record) => (
          <span className="tabular-nums">{record.greenPoints}</span>
        ),
      },
      {
        key: COLUMN_KEYS.STOCK,
        title: t("Stock"),
        className: "w-[120px]",
        render: (_, record) => (
          <span className="tabular-nums">
            {record.stockRemaining === null ? t("Unlimited") : record.stockRemaining}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.ACTIVE,
        title: t("Status"),
        className: "w-[100px]",
        render: (_, record) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
              record.isActive
                ? isDark
                  ? "bg-emerald-950/80 text-emerald-300"
                  : "bg-emerald-100 text-emerald-800"
                : isDark
                  ? "bg-zinc-800 text-zinc-400"
                  : "bg-zinc-200 text-zinc-700",
            )}
          >
            {record.isActive ? t("Active") : t("Inactive")}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.MEDIA,
        title: t("Media ID"),
        className: "w-[140px]",
        render: (_, record) => (
          <span className="font-mono text-xs" title={record.mediaId}>
            {shortId(record.mediaId)}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t("Action"),
        className: "w-[100px]",
        render: (_, record) => (
          <Button type="button" size="sm" variant="outline" onClick={() => onEdit(record)}>
            {t("Edit")}
          </Button>
        ),
      },
    ],
    [isDark, onEdit, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={gifts}
      loading={loading}
      rowKey="id"
      emptyTitle={t("No gifts found")}
      emptyDescription={t("No gifts match the current filters.")}
      pagination={{
        page: pagination.current,
        pageSize: pagination.pageSize,
        total,
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
