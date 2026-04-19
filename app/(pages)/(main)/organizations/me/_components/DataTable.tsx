"use client";

import { memo, useContext, useMemo, useCallback, useState } from "react";
import { DataTable, ColumnType } from "@/components/client/shared/DataTable";
import { MoreHorizontal, Building2 } from "lucide-react";
import { Button } from "@/components/client/shared/Button";
import { useTranslation } from "react-i18next";
import { OrganizationMeContext } from "../_context/OrganizationMeContext";
import { IOrganization } from "@/apis/organization/models/organization";
import { STATUS } from "@/constants/status";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/client/shared/DropdownMenu";
import { StatusTag } from "@/components/client/shared/StatusTag";
import FormFilter from "./FormFilter";
import useAuthStore from "@/stores/useAuthStore";
import { UpdateOrganizationPopover } from "./UpdateOrganizationPopover";
import { useLeaveOrganization } from "@/apis/organization/leaveOrganization";

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

  const [editOrganization, setEditOrganization] =
    useState<IOrganization | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEditOpenChange = useCallback((open: boolean) => {
    setEditDialogOpen(open);
    if (!open) setEditOrganization(null);
  }, []);

  const openEditDialog = useCallback((org: IOrganization) => {
    setEditOrganization(org);
    setEditDialogOpen(true);
  }, []);

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
          const isCurrentUserOwner =
            currentUserId != null && record.owner_id === currentUserId;

          return (
            <div className="flex flex-col gap-1 items-start">
              <StatusTag status={record.status as STATUS} />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                {isCurrentUserOwner ? t("Owner") : t("Member")}
              </span>
            </div>
          );
        },
        width: 140,
      },
      {
        title: t("Action"),
        key: "actions",
        render: (_, record) => {
          const isCurrentUserOwner =
            currentUserId != null && record.owner_id === currentUserId;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outlined-brown"
                  size="small"
                  className="h-8 w-8 p-0 border-none bg-transparent hover:bg-muted shadow-none group"
                  disabled={isLeavePending}
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {isCurrentUserOwner ? (
                  <DropdownMenuItem
                    className="text-xs cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      openEditDialog(record);
                    }}
                  >
                    {t("Edit")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-xs cursor-pointer text-destructive focus:text-destructive"
                    disabled={isLeavePending}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleLeave(record.id);
                    }}
                  >
                    {t("Leave group")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        width: 80,
      },
    ],
    [
      t,
      i18n.language,
      currentUserId,
      isLeavePending,
      handleLeave,
      openEditDialog,
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
      router.push(`/organizations/${record.id}`);
    },
    [router],
  );

  if (!context) return null;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <UpdateOrganizationPopover
        organization={editOrganization}
        open={editDialogOpen}
        onOpenChange={handleEditOpenChange}
        onUpdated={refetch}
      />
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
