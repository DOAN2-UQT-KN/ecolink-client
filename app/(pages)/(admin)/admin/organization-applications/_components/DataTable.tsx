import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbAlertTriangle } from "react-icons/tb";

import type {
  ApplicationStatus,
  IAdminApplication,
} from "@/apis/organization-application/models/application";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from "@/components/admin/shared/DataTable";
import { formattedDate } from "@/utils/formattedDate";
import { cn } from "@/libs/utils";
import { useApplicationsContext } from "../_context/ApplicationsContext";
import { ApplicationReviewDialog } from "./ApplicationReviewDialog";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Waiting for review",
  UNDER_REVIEW: "Under review",
  NEEDS_MORE_INFO: "More information needed",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  WITHDRAWN: "Withdrawn",
};

const STATUS_TONES: Record<ApplicationStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  SUBMITTED: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  NEEDS_MORE_INFO: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-zinc-100 text-zinc-700",
};

export function DataTable() {
  const { t } = useTranslation();
  const {
    applications,
    loading,
    pagination,
    total,
    onPageChange,
    onPageSizeChange,
  } = useApplicationsContext();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";

  const [openId, setOpenId] = useState<string | null>(null);

  const columns: DataTableColumn<IAdminApplication>[] = useMemo(
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
        key: "organization",
        title: t("Organization"),
        sticky: "left",
        render: (_, record) => (
          <div className="min-w-[220px]">
            <p className="font-medium">{record.profile?.name}</p>
            <p className="text-xs text-muted-foreground">{record.code}</p>
          </div>
        ),
      },
      {
        key: "contact_email",
        title: t("Contact email"),
        render: (_, record) => {
          // Split around the `@` so the domain — the thing that decides lane A — is the
          // first thing a reviewer reads.
          const [local, domain] = record.contact_email.split("@");
          return (
            <div className="min-w-[220px] text-sm">
              <span className="text-muted-foreground">{local}@</span>
              <span className="font-semibold">{domain}</span>
            </div>
          );
        },
      },
      {
        key: "org_type",
        title: t("Type"),
        render: (_, record) => (
          <span className="text-sm">{t(record.org_type)}</span>
        ),
      },
      {
        key: "documents",
        title: t("Documents"),
        render: (_, record) => (
          <span className="text-sm tabular-nums">
            {record.documents_waived
              ? t("Waived")
              : (record.documents?.length ?? 0)}
          </span>
        ),
      },
      {
        key: "status",
        title: t("Status"),
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                STATUS_TONES[record.status],
              )}
            >
              {t(STATUS_LABELS[record.status])}
            </span>
            {/* Approved but no ORG account yet: provisioning is still retrying, or stuck. */}
            {record.status === "APPROVED" && !record.account_provisioned_at && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium text-red-600"
                title={t(
                  "The organization account has not been created yet. The system keeps retrying.",
                )}
              >
                <TbAlertTriangle />
                {t("Account pending")}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "submitted_at",
        title: t("Submitted"),
        render: (_, record) => (
          <span className="text-sm">{formattedDate(record.submitted_at)}</span>
        ),
      },
      {
        key: "action",
        title: t("Action"),
        sticky: "right",
        render: (_, record) => (
          <div
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium",
                isDark
                  ? "border-zinc-700 hover:bg-zinc-800"
                  : "border-zinc-300 hover:bg-zinc-100",
              )}
              onClick={() => setOpenId(record.id)}
            >
              {t("Review")}
            </button>
          </div>
        ),
      },
    ],
    [isDark, pagination.current, pagination.pageSize, t],
  );

  return (
    <>
      <SharedDataTable
        columns={columns}
        data={applications}
        loading={loading}
        rowKey="id"
        emptyTitle="No applications found"
        emptyDescription="No applications match the current filters."
        pagination={{
          page: pagination.current,
          pageSize: pagination.pageSize,
          total,
          onPageChange,
          onPageSizeChange,
        }}
      />

      {openId && (
        <ApplicationReviewDialog
          applicationId={openId}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}

export default DataTable;
