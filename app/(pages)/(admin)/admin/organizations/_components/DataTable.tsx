"use client";

import { useMemo } from "react";
import Link from "next/link";

import type { IOrganization } from "@/apis/organization/models/organization";
import { STATUS } from "@/constants/status";
import { useOrganizationContext } from "../_context/OrganizationContext";
import { DataTable as SharedDataTable, type DataTableColumn } from "@/components/admin/shared/DataTable";

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
                className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-600"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold uppercase text-zinc-400">
                {record.name.slice(0, 2)}
              </div>
            )}
            <div className="font-medium text-zinc-100">{record.name}</div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.CREATED,
        title: "Created at + Owner",
        className: "min-w-[180px]",
        render: (_, record) => (
          <div className="space-y-1">
            <p className="text-sm text-zinc-200">{toDisplayDate(record.created_at)}</p>
            <p className="text-xs text-zinc-500">Owner: {toOwnerLabel(record.owner_id)}</p>
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
            <span className="rounded-full bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-400">
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
          <span className="text-zinc-300">{(value as string | null) || "-"}</span>
        ),
      },
      {
        key: COLUMN_KEYS.DESCRIPTION,
        title: "Description",
        dataIndex: "description",
        className: "min-w-[260px]",
        render: (value) => (
          <p className="line-clamp-2 text-sm text-zinc-400">
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
            <Link
              href={`/organizations/${record.id}`}
              className="rounded-md border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              Preview
            </Link>
            <Link
              href={`/admin/organizations/${record.id}`}
              className="rounded-md border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              Edit
            </Link>
          </div>
        ),
      },
    ],
    [],
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
