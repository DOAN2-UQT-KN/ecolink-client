import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbFileSearch } from "react-icons/tb";

import type { IAdminApplication } from "@/apis/organization-application/models/application";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from "@/components/admin/shared/DataTable";
import TagStatus from "@/components/ui/TagStatus";
import { APPLICATION_STATUS_TAG } from "@/constants/organizationApplicationStatus";
import { formattedDate } from "@/utils/formattedDate";
import { cn } from "@/libs/utils";
import { useApplicationsContext } from "../_context/ApplicationsContext";
import { ApplicationReviewDialog } from "./ApplicationReviewDialog";

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
          const [local, domain] = (
            record.contact_email ?? record.submitter_email
          ).split("@");
          return (
            <div className="min-w-[220px] text-sm">
              <span className="text-muted-foreground">{local}@</span>
              <span className="font-semibold">{domain}</span>
            </div>
          );
        },
      },
      {
        key: "owners",
        title: t("Owners"),
        render: (_, record) => (
          <span className="text-sm tabular-nums">
            {record.owners?.length ?? 0}
          </span>
        ),
      },
      {
        key: "org_type",
        title: t("Type"),
        render: (_, record) => (
          <span className="text-sm">{record.org_type ? t(record.org_type) : "—"}</span>
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
            <TagStatus
              type={APPLICATION_STATUS_TAG[record.status].type}
              label={t(APPLICATION_STATUS_TAG[record.status].label)}
              className="!mx-0 min-w-0 justify-center"
            />
          </div>
        ),
      },
      {
        key: "submitted_at",
        title: t("Submitted"),
        render: (_, record) => (
          <span className="text-sm">
            {record.submitted_at ? formattedDate(record.submitted_at) : "—"}
          </span>
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
            className="flex items-center justify-center w-full"
          >
            <button
              type="button"
              title={t("Review")}
              aria-label={t("Review")}
              className={cn(
                "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
                isDark
                  ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700",
              )}
              onClick={() => setOpenId(record.id)}
            >
              <TbFileSearch className="size-5" />
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
