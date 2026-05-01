"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { IAdminBadgeDefinition } from "@/apis/gamification/models/gamificationBadge";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from "@/components/admin/shared/DataTable";
import ChangeStatus from "@/components/ui/ChangeStatus";
import { STATUS } from "@/constants/status";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";
import { TbPencil } from "react-icons/tb";

import { useBadgeAdminContext } from "../_context/BadgeAdminContext";

const COLUMN_KEYS = {
  NO: "no",
  ID: "id",
  SLUG: "slug",
  NAME: "name",
  SYMBOL: "symbol",
  RULE_TYPE: "rule_type",
  THRESHOLD: "threshold",
  RANK_TOP_N: "rank_top_n",
  RANK_METRIC: "rank_metric",
  REWARD: "reward",
  ACTIVE: "active",
  CREATED_AT: "created_at",
  UPDATED_AT: "updated_at",
  DELETED_AT: "deleted_at",
  ACTION: "action",
} as const;

function rewardPreview(reward: Record<string, unknown> | null | undefined): string {
  if (reward == null) return "—";
  try {
    const s = JSON.stringify(reward);
    return s.length > 120 ? `${s.slice(0, 117)}…` : s;
  } catch {
    return "—";
  }
}

function stripUuid(id: string): string {
  return id.length > 13 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export function DataTable({
  onEdit,
}: {
  onEdit: (badge: IAdminBadgeDefinition) => void;
}) {
  const { t } = useTranslation();
  const {
    badges,
    loading,
    total,
    pagination,
    errorMessage,
    onRetry,
    onPageChange,
    onPageSizeChange,
  } = useBadgeAdminContext();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";

  const columns: DataTableColumn<IAdminBadgeDefinition>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NO,
        title: t("No"),
        className: "w-[64px]",
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.ID,
        title: t("Id"),
        className: "min-w-[120px] font-mono text-xs",
        render: (_, row) => (
          <span title={row.id}>{stripUuid(row.id)}</span>
        ),
      },
      {
        key: COLUMN_KEYS.SLUG,
        title: t("Slug"),
        className: "min-w-[120px]",
        render: (_, row) => (
          <span
            className={cn(
              "font-medium",
              isDark ? "text-zinc-100" : "text-zinc-900",
            )}
          >
            {row.slug}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.NAME,
        title: t("Name"),
        className: "min-w-[160px]",
        render: (_, row) => (
          <span className={cn(isDark ? "text-zinc-200" : "text-zinc-800")}>
            {row.name}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.SYMBOL,
        title: t("Symbol"),
        className: "w-[100px]",
        render: (_, row) => (
          <span className="text-lg leading-none">
            {row.symbol?.trim() ? row.symbol : "—"}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.RULE_TYPE,
        title: t("Rule type"),
        className: "w-[88px]",
        render: (_, row) => (
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-semibold uppercase",
              isDark
                ? "bg-zinc-800 text-zinc-200"
                : "bg-zinc-100 text-zinc-800",
            )}
          >
            {row.ruleType}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.THRESHOLD,
        title: t("Threshold"),
        className: "w-[100px] tabular-nums",
        render: (_, row) => (
          <span>{row.threshold == null ? "—" : row.threshold}</span>
        ),
      },
      {
        key: COLUMN_KEYS.RANK_TOP_N,
        title: t("Rank top N"),
        className: "w-[100px] tabular-nums",
        render: (_, row) => (
          <span>{row.rankTopN == null ? "—" : row.rankTopN}</span>
        ),
      },
      {
        key: COLUMN_KEYS.RANK_METRIC,
        title: t("Rank metric"),
        className: "w-[120px]",
        render: (_, row) => (
          <span>{row.rankMetric ?? "—"}</span>
        ),
      },
      {
        key: COLUMN_KEYS.REWARD,
        title: t("Reward"),
        className: "min-w-[200px] max-w-[280px]",
        render: (_, row) => (
          <code
            className={cn(
              "block truncate text-xs",
              isDark ? "text-zinc-400" : "text-muted-foreground",
            )}
            title={rewardPreview(row.reward ?? undefined)}
          >
            {rewardPreview(row.reward ?? undefined)}
          </code>
        ),
      },
      {
        key: COLUMN_KEYS.ACTIVE,
        title: t("Status"),
        className: "w-[100px]",
        render: (_, row) => (
          <div className="w-fit">
            <ChangeStatus
              type={row.isActive ? STATUS.ACTIVE : STATUS.INACTIVE}
              enabledDropdown={false}
            />
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.CREATED_AT,
        title: t("Created at"),
        className: "min-w-[112px] whitespace-nowrap",
        render: (_, row) => formattedDate(row.createdAt, true),
      },
      {
        key: COLUMN_KEYS.UPDATED_AT,
        title: t("Updated at"),
        className: "min-w-[112px] whitespace-nowrap",
        render: (_, row) => formattedDate(row.updatedAt, true),
      },
      {
        key: COLUMN_KEYS.DELETED_AT,
        title: t("Deleted at"),
        className: "min-w-[112px] whitespace-nowrap",
        render: (_, row) =>
          row.deletedAt ? formattedDate(row.deletedAt, true) : "—",
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t("Action"),
        className: "w-[100px]",
        render: (_, row) => (
          <button
            type="button"
            className={cn(
              "cursor-pointer rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors duration-200",
              isDark
                ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700",
            )}
            onClick={() => onEdit(row)}
          >
            <TbPencil className="size-5" />
          </button>
        ),
      },
    ],
    [isDark, onEdit, pagination.current, pagination.pageSize, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={badges}
      loading={loading}
      error={errorMessage}
      onRetry={onRetry}
      rowKey="id"
      emptyTitle={t("No badges found")}
      emptyDescription={t("No badges match the current filters.")}
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
