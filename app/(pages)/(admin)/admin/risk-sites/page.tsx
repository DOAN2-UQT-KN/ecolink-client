import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetRiskSites } from "@/apis/risk-site/getRiskSites";
import type { IRiskSiteRow } from "@/apis/risk-site/models/riskSite";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/shared/DataTable";

/** What people found when they went to the places the risk model flagged. */
export default function AdminRiskSitesPage() {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const { data, isLoading } = useGetRiskSites({
    page: pagination.page,
    limit: pagination.pageSize,
  });
  const rows = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Dashboard"), path: "/admin", type: "link" },
      { label: t("Risk site checks"), path: "/admin/risk-sites", type: "page" },
    ],
    [t],
  );

  const columns: DataTableColumn<IRiskSiteRow>[] = useMemo(
    () => [
      {
        key: "address",
        title: t("Address"),
        className: "min-w-[260px]",
        render: (_, row) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.address}</span>
            <a
              href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              {row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}
            </a>
          </div>
        ),
      },
      {
        key: "yes",
        title: t("Has trash"),
        className: "min-w-[120px]",
        render: (_, row) => (
          <span className="font-semibold tabular-nums text-red-600">
            {row.yes_count}
          </span>
        ),
      },
      {
        key: "no",
        title: t("No trash"),
        className: "min-w-[120px]",
        render: (_, row) => (
          <span className="font-semibold tabular-nums text-emerald-600">
            {row.no_count}
          </span>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        rowKey="site_key"
        emptyTitle={t("No answers yet")}
        emptyDescription={t(
          "Answers appear here after people mark a place on the trash risk map.",
        )}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total,
          onPageChange: (page: number) =>
            setPagination((p) => ({ ...p, page })),
          onPageSizeChange: (pageSize: number) =>
            setPagination({ page: 1, pageSize }),
        }}
      />
    </div>
  );
}
