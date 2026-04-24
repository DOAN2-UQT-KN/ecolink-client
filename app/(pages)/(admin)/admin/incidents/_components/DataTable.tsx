"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

import type { IIncident } from "@/apis/incident/models/incident";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import AddressDisplay from "@/app/(pages)/(main)/incidents/me/_components/AddressDisplay";
import { DataTable as SharedDataTable, type DataTableColumn } from "@/components/admin/shared/DataTable";
import { PreviewIncidentPopover } from "./PreviewIncidentPopover";
import { StatusTag } from "@/components/ui/StatusTag";
import { cn } from "@/libs/utils";
import { useIncidentContext } from "../_context/IncidentContext";
import { VerifyIncidentConfirm } from "./VerifyIncidentConfirm";
import { TbScanEye } from "react-icons/tb";

const COLUMN_KEYS = {
  NO: "no",
  INCIDENT: "incident",
  OWNER: "owner",
  STATUS: "status",
  ACTION: "action",
} as const;

function toDisplayDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function toUserLabel(userId?: string | null) {
  if (!userId) return "-";
  return userId.length > 12 ? `${userId.slice(0, 6)}...${userId.slice(-4)}` : userId;
}

export function DataTable() {
  const { t } = useTranslation();
  const { incidents, loading, pagination, total, onPageChange, onPageSizeChange } =
    useIncidentContext();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";

  const columns: DataTableColumn<IIncident>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NO,
        title: t("No"),
        className: "w-[72px]",
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.INCIDENT,
        title: t("Incident"),
        className: "sticky left-0 z-20 min-w-[280px]",
        render: (_, record) => (
          <div className="flex items-center gap-3 py-1">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted">
              {record.media_files?.[0]?.url ? (
                <Image
                  src={record.media_files[0].url}
                  alt={record.title || t("Untitled Incident")}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className={cn(
                  "truncate text-sm font-bold",
                  isDark ? "text-zinc-100" : "text-zinc-900",
                )}
              >
                {record.title || t("Untitled Incident")}
              </span>
              <span
                className={cn(
                  "mb-0.5 line-clamp-1 text-xs",
                  isDark ? "text-zinc-400" : "text-muted-foreground",
                )}
              >
                {record.description}
              </span>
              <div className="mt-0.5 flex items-center gap-1 overflow-hidden">
                <div className="min-w-0 flex-1">
                  <AddressDisplay
                    latitude={record.latitude}
                    longitude={record.longitude}
                    address={record.detail_address}
                  />
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.OWNER,
        title: t("Owner"),
        className: "min-w-[180px]",
        render: (_, record) => (
          <div className="space-y-1">
            <p className={cn("font-display-1", isDark ? "text-zinc-200" : "text-zinc-800")}>
              {toDisplayDate(record.created_at)}
            </p>
            <p className={cn("font-display-1", isDark ? "text-zinc-500" : "text-zinc-600")}>
              {t("User")}: {toUserLabel(record.user_id)}
            </p>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.STATUS,
        title: t("Status"),
        className: "min-w-[120px]",
        render: (_, record) => (
          <StatusTag status={record.status} className="!mx-0 min-w-0 justify-center" />
        ),
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t("Action"),
        className: "min-w-[160px]",
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <PreviewIncidentPopover
              incident={record}
              theme={isDark ? "dark" : "light"}
              trigger={
                <button
                  type="button"
                  className={cn(
                    "cursor-pointer rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors duration-200",
                    isDark
                      ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700",
                  )}
                >
                  <TbScanEye className="size-5" />
                </button>
              }
            />
            <VerifyIncidentConfirm
              incidentId={record.id}
              incidentTitle={record.title || t("Untitled Incident")}
              theme={isDark ? "dark" : "light"}
            />
          </div>
        ),
      },
    ],
    [isDark, pagination.current, pagination.pageSize, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={incidents}
      loading={loading}
      rowKey="id"
      emptyTitle={t("No incidents found")}
      emptyDescription={t("No incidents available for the current filters.")}
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
