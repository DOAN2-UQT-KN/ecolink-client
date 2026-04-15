"use client";

import { useMemo } from "react";
import Link from "next/link";

import type { IOrganization } from "@/apis/organization/models/organization";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { STATUS } from "@/constants/status";
import { cn } from "@/libs/utils";
import { useOrganizationContext } from "../_context/OrganizationContext";
import {
  DataTable as SharedDataTable,
  PreviewIncidentPopover,
  type DataTableColumn,
} from "@/components/admin/shared/DataTable";

const COLUMN_KEYS = {
  NAME_LOGO: "name_logo",
  CREATED: "created",
  STATUS: "status",
  CONTACT_EMAIL: "contact_email",
  DESCRIPTION: "description",
  ACTION: "action",
} as const;

const STATUS_LABELS: Record<number, string> = {
  [STATUS.ACTIVE]: "Active",
  [STATUS.INACTIVE]: "Inactive",
  [STATUS.PENDING]: "Pending",
  [STATUS.APPROVED]: "Approved",
  [STATUS.REJECTED]: "Rejected",
};

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
  const { organizations, loading, pagination, total, onPageChange, onPageSizeChange } =
    useOrganizationContext();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";

  const columns: DataTableColumn<IOrganization>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NAME_LOGO,
        title: "Name + Logo",
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
                  "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold uppercase",
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
        title: "Created at + Owner",
        className: "min-w-[180px]",
        render: (_, record) => (
          <div className="space-y-1">
            <p
              className={cn(
                "text-sm",
                isDark ? "text-zinc-200" : "text-zinc-800",
              )}
            >
              {toDisplayDate(record.created_at)}
            </p>
            <p
              className={cn(
                "text-xs",
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
        title: "Status",
        className: "min-w-[120px]",
        render: (_, record) => {
          const label = STATUS_LABELS[record.status] ?? `Status ${record.status}`;
          return (
            <span
              className={cn(
                "rounded-full px-2 py-1 text-xs font-medium",
                isDark
                  ? "bg-amber-900/30 text-amber-400"
                  : "bg-amber-100 text-amber-800",
              )}
            >
              {label}
            </span>
          );
        },
      },
      {
        key: COLUMN_KEYS.CONTACT_EMAIL,
        title: "Contact Email",
        dataIndex: "contact_email",
        className: "min-w-[220px]",
        render: (value) => (
          <span className={isDark ? "text-zinc-300" : "text-zinc-800"}>
            {(value as string | null) || "-"}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.DESCRIPTION,
        title: "Description",
        dataIndex: "description",
        className: "min-w-[260px]",
        render: (value) => (
          <p
            className={cn(
              "line-clamp-2 text-sm",
              isDark ? "text-zinc-400" : "text-zinc-600",
            )}
          >
            {(value as string | null) || "-"}
          </p>
        ),
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: "Action",
        className: "min-w-[160px]",
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <PreviewIncidentPopover
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
                    "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                    isDark
                      ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                  )}
                >
                  Preview
                </button>
              }
            />
            <Link
              href={`/admin/organizations/${record.id}`}
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                isDark
                  ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              Edit
            </Link>
          </div>
        ),
      },
    ],
    [isDark],
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
