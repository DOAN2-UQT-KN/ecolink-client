"use client";

import { useMemo } from "react";
import Link from "next/link";

import {
  DataTable as SharedDataTable,
  type ColumnType,
} from "@/components/client/shared/DataTable";
import type { IOrganization } from "@/apis/organization/models/organization";
import { STATUS } from "@/constants/status";
import { useOrganizationContext } from "../_context/OrganizationContext";

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
  const { organizations, loading, pagination, total, onPageChange } = useOrganizationContext();
  const columns: ColumnType<IOrganization>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NAME_LOGO,
        title: "Name + Logo",
        className: "sticky left-0 z-20 min-w-[220px] bg-card",
        render: (_, record) => (
          <div className="flex items-center gap-3">
            {record.logo_url ? (
              <img
                src={record.logo_url}
                alt={record.name}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                {record.name.slice(0, 2)}
              </div>
            )}
            <div className="font-medium text-foreground">{record.name}</div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.CREATED,
        title: "Created at + Created by",
        className: "min-w-[180px]",
        render: (_, record) => (
          <div className="space-y-1">
            <p className="text-sm">{toDisplayDate(record.created_at)}</p>
            <p className="text-xs text-muted-foreground">Owner: {toOwnerLabel(record.owner_id)}</p>
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
            <span className="rounded-full bg-[#887A47]/10 px-2 py-1 text-xs font-medium text-[#887A47]">
              {label}
            </span>
          );
        },
      },
      {
        key: COLUMN_KEYS.CONTACT_EMAIL,
        title: "Contact email",
        dataIndex: "contact_email",
        className: "min-w-[220px]",
        render: (value) => <span>{(value as string | null) || "-"}</span>,
      },
      {
        key: COLUMN_KEYS.DESCRIPTION,
        title: "Description",
        dataIndex: "description",
        className: "min-w-[260px]",
        render: (value) => (
          <p className="line-clamp-2 text-sm text-foreground-secondary">
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
              className="rounded-md border border-[#887A47]/40 px-2 py-1 text-xs font-medium text-[#887A47] hover:bg-[#887A47]/10"
            >
              Preview
            </Link>
            <Link
              href={`/admin/organizations/${record.id}`}
              className="rounded-md border border-[#887A47]/40 px-2 py-1 text-xs font-medium text-[#887A47] hover:bg-[#887A47]/10"
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
      dataSource={organizations}
      loading={loading}
      rowKey="id"
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total,
      }}
      onChange={(nextPagination) => onPageChange(nextPagination.current)}
      emptyText="No organizations available for current filters."
    />
  );
}
