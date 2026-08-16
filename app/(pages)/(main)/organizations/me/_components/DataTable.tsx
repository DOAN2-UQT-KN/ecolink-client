import { memo, useContext, useMemo, useCallback } from "react";
import { DataTable, ColumnType } from "@/components/client/shared/DataTable";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OrganizationMeContext } from "../_context/OrganizationMeContext";
import { IOrganization } from "@/apis/organization/models/organization";
import { useRouter } from "@/libs/router";
import { StatusTag } from "@/components/ui/StatusTag";
import FormFilter from "./FormFilter";
import useAuthStore from "@/stores/useAuthStore";
import { useLeaveOrganization } from "@/apis/organization/leaveOrganization";
import { STATUS } from "@/constants/status";

const defaultPagination = { current: 1, pageSize: 10 };

const noop = () => {};
const noopSetPagination = (_page: { current: number; pageSize: number }) => {};

const DataTableComponent = memo(function DataTableComponent() {
  const { t, i18n } = useTranslation();
  const context = useContext(OrganizationMeContext);
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { mutate: leaveMutate, isPending: isLeavePending } =
    useLeaveOrganization();

  const organizations = context?.organizations ?? [];
  const isLoading = context?.isLoading ?? false;
  const total = context?.total ?? 0;
  const pagination = context?.pagination ?? defaultPagination;
  const setPagination = context?.setPagination ?? noopSetPagination;
  const refetch = context?.refetch ?? noop;

  const handleLeave = useCallback(
    (orgId: string) => {
      leaveMutate(
        { id: orgId },
        {
          onSuccess: () => {
            refetch();
          },
        },
      );
    },
    [leaveMutate, refetch],
  );

  const columns: ColumnType<IOrganization>[] = useMemo(
    () => [
      {
        title: t("Organization"),
        key: "organization",
        render: (_, record) => (
          <div className="flex items-center gap-3 py-1">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted flex items-center justify-center">
              {record.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.logo_url}
                  alt={record.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-sm truncate">{record.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {record.contact_email || "—"}
              </span>
            </div>
          </div>
        ),
        width: 280,
      },
      {
        title: t("Created At"),
        dataIndex: "created_at",
        key: "created_at",
        render: (created_at) => {
          const date = created_at ? new Date(created_at) : null;
          const isValidDate = date && !isNaN(date.getTime());

          return (
            <span className="text-xs text-muted-foreground/80 font-medium whitespace-nowrap">
              {isValidDate
                ? new Intl.DateTimeFormat(
                    i18n.language === "vi" ? "vi-VN" : "en-GB",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  ).format(date)
                : "—"}
            </span>
          );
        },
        width: 150,
      },
      {
        title: t("Status"),
        key: "status",
        render: (_, record) => {
          return <StatusTag status={record.status} className="!mx-0 min-w-0 justify-center" label={record.status === STATUS.INACTIVE ? t("Banned") : undefined} />;
        },
        width: 140,
        align: "center",
      },
      {
        title: t("Ban Reason"),
        key: "reject_reason",
        render: (_, record) => {
          const reason = record.reject_reason?.trim();
          return (
            <span className="text-xs text-muted-foreground whitespace-pre-wrap break-words line-clamp-3">
              {reason || "—"}
            </span>
          );
        },
        width: 220,
      },

    ],
    [
      t,
      i18n.language,
      currentUserId,
      isLeavePending,
      handleLeave,
    ],
  );

  const handleTableChange = useCallback(
    (page: { current: number; pageSize: number }) => {
      setPagination(page);
    },
    [setPagination],
  );

  const handleRowClick = useCallback(
    (record: IOrganization) => {
      if (!record.slug) return;
      router.push(`/organizations/${record.slug}`);
    },
    [router],
  );

  if (!context) return null;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <DataTable
        rowKey="id"
        columns={columns}
        dataSource={organizations}
        loading={isLoading}
        pagination={{
          ...pagination,
          total: total,
        }}
        onChange={handleTableChange}
        emptyText={t("No organizations yet")}
        filter={<FormFilter />}
        onRowClick={handleRowClick}
      />
    </div>
  );
});

export default DataTableComponent;
