import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TbScanEye } from "react-icons/tb";

import type { IGridCell } from "@/apis/grid-cell/models/gridCell";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from "@/components/admin/shared/DataTable";
import { Link } from "@/libs/router";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";
import { useGridCellContext } from "../_context/GridCellContext";

export function DataTable() {
  const { t } = useTranslation();
  const { cells, loading, pagination, total, onPageChange, onPageSizeChange } =
    useGridCellContext();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";
  const muted = isDark ? "text-zinc-400" : "text-zinc-600";

  const columns: DataTableColumn<IGridCell>[] = useMemo(
    () => [
      {
        key: "no",
        title: t("No"),
        className: "w-[72px]",
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
      },
      {
        key: "cell",
        title: t("Cell"),
        className: "min-w-[200px]",
        render: (_, record) => (
          <div className="flex flex-col">
            <span className="font-mono text-sm">{record.cell_key}</span>
            <span className={cn("text-xs", muted)}>
              {record.center_lat.toFixed(5)}, {record.center_lng.toFixed(5)}
            </span>
          </div>
        ),
      },
      {
        key: "submitted",
        title: t("Reports"),
        className: "min-w-[100px]",
        render: (_, record) => (
          <span className="tabular-nums font-medium">
            {record.submitted_count}
          </span>
        ),
      },
      {
        key: "verified",
        title: t("Verified"),
        className: "min-w-[100px]",
        render: (_, record) => (
          <span className="tabular-nums">{record.verified_count}</span>
        ),
      },
      {
        key: "last_report",
        title: t("Latest report"),
        className: "min-w-[150px]",
        render: (_, record) => (
          <span className={cn("text-sm", muted)}>
            {record.last_report_at ? formattedDate(record.last_report_at) : "—"}
          </span>
        ),
      },
      {
        key: "cleanups",
        title: t("Cleanups"),
        className: "min-w-[100px]",
        render: (_, record) => (
          <span className="tabular-nums">{record.cleanup_count}</span>
        ),
      },
      {
        key: "last_cleaned",
        title: t("Latest cleanup"),
        className: "min-w-[150px]",
        render: (_, record) => (
          <span className={cn("text-sm", muted)}>
            {record.last_cleaned_at
              ? formattedDate(record.last_cleaned_at)
              : "—"}
          </span>
        ),
      },
      {
        key: "action",
        title: t("Action"),
        className: "min-w-[100px]",
        sticky: "right",
        render: (_, record) => (
          <Link
            href={`/admin/grid-cells/${encodeURIComponent(record.cell_key)}`}
            title={t("See more")}
            className={cn(
              "inline-flex rounded-md border px-1.5 py-1.5 transition-colors duration-200",
              isDark
                ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700",
            )}
          >
            <TbScanEye className="size-5" />
          </Link>
        ),
      },
    ],
    [isDark, muted, pagination.current, pagination.pageSize, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={cells}
      loading={loading}
      rowKey="cell_key"
      emptyTitle={t("No grid cells found")}
      emptyDescription={t(
        "A cell appears after the first report is submitted inside it.",
      )}
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
