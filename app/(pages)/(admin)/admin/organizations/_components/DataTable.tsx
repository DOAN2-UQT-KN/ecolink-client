"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { IOrganization } from "@/apis/organization/models/organization";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { StatusTag } from "@/components/ui/StatusTag";
import { cn } from "@/libs/utils";
import { useOrganizationContext } from "../_context/OrganizationContext";
import { DataTable as SharedDataTable, type DataTableColumn } from "@/components/admin/shared/DataTable";
import { PreviewOrganizationPopover } from "./PreviewOrganizationPopover";
import { ApproveOrganizationConfirm } from "./ApproveOrganizationConfirm";
import { TbScanEye  } from "react-icons/tb";


const COLUMN_KEYS = {
  NAME_LOGO: "name_logo",
  CREATED: "created",
  STATUS: "status",
  CONTACT_EMAIL: "contact_email",
  DESCRIPTION: "description",
  ACTION: "action",
} as const;

function toDisplayDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function toOwnerLabel(ownerId?: string | null) {
  if (!ownerId) return "-";
  return ownerId.length > 12 ? `${ownerId.slice(0, 6)}...${ownerId.slice(-4)}` : ownerId;
}

export function DataTable() {
  const { t } = useTranslation();
  const { organizations, loading, pagination, total, onPageChange, onPageSizeChange } =
    useOrganizationContext();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";

  const columns: DataTableColumn<IOrganization>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NAME_LOGO,
        title: t("Organization"),
        className: "sticky left-0 z-20 min-w-[220px]",
        render: (_, record) => (
          <div className="flex items-center gap-3">
            {record.logo_url ? (
              <img
                src={record.logo_url}
                alt={record.name}
                className={cn(
                  "h-9 w-9 rounded-full object-cover ring-1",
                  isDark ? "ring-zinc-600" : "ring-zinc-300",
                )}
              />
            ) : (
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full font-display-1 uppercase",
                  isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-600",
                )}
              >
                {record.name.slice(0, 2)}
              </div>
            )}
            <div
              className={cn(
                "font-medium",
                isDark ? "text-zinc-100" : "text-zinc-900",
              )}
            >
              {record.name}
            </div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.CREATED,
        title: t("Owner"),
        className: "min-w-[180px]",
        render: (_, record) => (
          <div className="space-y-1">
            <p
              className={cn(
                "font-display-1",
                isDark ? "text-zinc-200" : "text-zinc-800",
              )}
            >
              {toDisplayDate(record.created_at)}
            </p>
            <p
              className={cn(
                "font-display-1",
                isDark ? "text-zinc-500" : "text-zinc-600",
              )}
            >
              Owner: {toOwnerLabel(record.owner_id)}
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
        key: COLUMN_KEYS.CONTACT_EMAIL,
        title: t("Contact email"),
        dataIndex: "contact_email",
      },
      {
        key: COLUMN_KEYS.DESCRIPTION,
        title: t("Description"),
        dataIndex: "description",
        className: "min-w-[260px]",
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t("Action"),
        className: "min-w-[160px]",
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <PreviewOrganizationPopover
              name={record.name}
              description={record.description ?? ""}
              logoUrl={record.logo_url ?? ""}
              backgroundUrl={record.background_url ?? ""}
              contactEmail={record.contact_email ?? ""}
              theme={isDark ? "dark" : "light"}
              trigger={
                <button
                  type="button"
                  className={cn(
                    "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
                    isDark
                      ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700",
                  )}
                >
                  <TbScanEye className="size-5" />
                </button>
              }
            />
            <ApproveOrganizationConfirm
              organizationId={record.id}
              organizationName={record.name}
              theme={isDark ? "dark" : "light"}
            />
          </div>
        ),
      },
    ],
    [isDark, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={organizations}
      loading={loading}
      rowKey="id"
      emptyTitle="No organizations found"
      emptyDescription="No organizations available for the current filters."
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
