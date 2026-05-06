"use client";

import { useMemo } from "react";
import { DataTable as SharedDataTable, type DataTableColumn } from "@/components/admin/shared/DataTable";
import { useTranslation } from "react-i18next";
import type {
  ConfigTabKey,
  DifficultyItem,
  MultiplierItem,
  PayoutTierItem,
} from "../_services/config.service";

type TableRow = Record<string, unknown>;

export function DataTable({
  tab,
  data,
  loading,
  onEdit,
  onDelete,
  onInlineValueChange,
}: {
  tab: ConfigTabKey;
  data: TableRow[];
  loading?: boolean;
  onEdit?: (row: TableRow) => void;
  onDelete?: (row: TableRow) => void;
  onInlineValueChange?: (row: TableRow, value: number) => void;
}) {
  const { t } = useTranslation();

  const columns = useMemo(() => {
    if (tab === "point-rules") {
      return [
        { key: "difficulty", title: t("Difficulty"), dataIndex: "difficulty", className: "min-w-[180px]" },
        {
          key: "cap",
          title: t("Bonus cap"),
          className: "min-w-[160px]",
          render: (_, row) => (
            <input
              type="number"
              className="h-9 w-full rounded-md border border-zinc-300 bg-transparent px-2 text-sm"
              value={Number((row as { cap: number }).cap ?? 0)}
              onChange={(e) => onInlineValueChange?.(row, Number(e.target.value))}
            />
          ),
        },
      ] satisfies DataTableColumn<TableRow>[];
    }
    if (tab === "multipliers") {
      return [
        { key: "code", title: t("Code"), dataIndex: "code", className: "min-w-[140px]" },
        { key: "description", title: t("Description"), dataIndex: "description", className: "min-w-[220px]" },
        { key: "multiplier", title: t("Multiplier"), dataIndex: "multiplier", className: "min-w-[120px]" },
        {
          key: "action",
          title: t("Action"),
          className: "w-[120px]",
          render: (_, row) => (
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100"
              onClick={() => onEdit?.(row)}
            >
              {t("Edit")}
            </button>
          ),
        },
      ] satisfies DataTableColumn<MultiplierItem>[];
    }
    if (tab === "difficulty-settings") {
      return [
        { key: "level", title: t("Difficulty level"), dataIndex: "level", className: "min-w-[160px]" },
        { key: "name", title: t("Name"), dataIndex: "name", className: "min-w-[220px]" },
        { key: "greenPointsReward", title: t("GreenPoints reward"), dataIndex: "greenPointsReward", className: "min-w-[160px]" },
        {
          key: "action",
          title: t("Action"),
          className: "w-[120px]",
          render: (_, row) => (
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100"
              onClick={() => onEdit?.(row)}
            >
              {t("Edit")}
            </button>
          ),
        },
      ] satisfies DataTableColumn<DifficultyItem>[];
    }
    return [
      { key: "rankMin", title: t("Rank min"), dataIndex: "rankMin", className: "min-w-[130px]" },
      { key: "rankMax", title: t("Rank max"), dataIndex: "rankMax", className: "min-w-[130px]" },
      { key: "spAmount", title: t("SP amount"), dataIndex: "spAmount", className: "min-w-[130px]" },
      {
        key: "preview",
        title: t("Preview"),
        className: "min-w-[260px]",
        render: (_, row) => (
          <span className="text-xs text-muted-foreground">
            {t("Top {{rankMin}}-{{rankMax}} users receive {{spAmount}} SP", {
              rankMin: String(row.rankMin),
              rankMax: String(row.rankMax),
              spAmount: String(row.spAmount),
            })}
          </span>
        ),
      },
      {
        key: "action",
        title: t("Action"),
        className: "w-[180px]",
        render: (_, row) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100"
              onClick={() => onEdit?.(row)}
            >
              {t("Edit")}
            </button>
            <button
              type="button"
              className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
              onClick={() => onDelete?.(row)}
            >
              {t("Delete")}
            </button>
          </div>
        ),
      },
    ] satisfies DataTableColumn<PayoutTierItem>[];
  }, [onDelete, onEdit, onInlineValueChange, t, tab]);

  return (
    <SharedDataTable
      columns={columns as DataTableColumn<TableRow>[]}
      data={data}
      rowKey={(row, idx) => String((row as { id?: string }).id ?? idx)}
      loading={loading}
      emptyTitle={t("No records found")}
      emptyDescription={t("No configuration rows available.")}
    />
  );
}
