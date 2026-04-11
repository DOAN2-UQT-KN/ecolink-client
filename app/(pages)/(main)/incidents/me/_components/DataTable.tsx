import React, { memo, useContext, useMemo, useCallback } from "react";
import { DataTable, ColumnType } from "@/components/shared/DataTable";
import { MoreHorizontal, User } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { useTranslation } from "react-i18next";
import { IncidentMeContext } from "../_context/IncidentMeContext";
import { IIncident } from "@/apis/incident/models/incident";
import { STATUS } from "@/constants/status";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shared/DropdownMenu";

import AddressDisplay from "./AddressDisplay";

import { StatusTag } from "@/components/shared/StatusTag";
import FormFilter from "./FormFilter";

const DataTableComponent = memo(function DataTableComponent() {
  const { t, i18n } = useTranslation();
  const context = useContext(IncidentMeContext);
  const router = useRouter();

  if (!context) return null;

  const { reports, isLoading, total, pagination, setPagination } = context;

  const columns: ColumnType<IIncident>[] = useMemo(
    () => [
      {
        title: t("Incident"),
        key: "incident",
        render: (_, record) => (
          <div className="flex items-center gap-3 py-1">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted">
              <Image
                src={record.media_files?.[0]?.url || ""}
                alt={record.title || t("Untitled Incident")}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-sm truncate">
                {record.title || t("Untitled Incident")}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-1 mb-0.5">
                {record.description}
              </span>
              <div className="flex items-center gap-1 overflow-hidden mt-0.5">
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
        width: 300,
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
        dataIndex: "status",
        key: "status",
        render: (status) => <StatusTag status={status as STATUS} />,
        width: 120,
      },
      {
        title: t("Handled by"),
        key: "handledBy",
        render: () => (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase">
                {t("EcoLink Team")}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {t("Admin Organization")}
              </span>
            </div>
          </div>
        ),
        width: 180,
      },
      {
        title: t("Action"),
        key: "actions",
        render: (_, record) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outlined-brown"
                size="small"
                className="h-8 w-8 p-0 border-none bg-transparent hover:bg-muted shadow-none group"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem className="text-xs cursor-pointer">
                {t("View Details")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer">
                {t("Edit Report")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer text-destructive focus:text-destructive">
                {t("Delete Report")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        width: 80,
      },
    ],
    [t, i18n.language],
  );

  const handleTableChange = useCallback(
    (page: { current: number; pageSize: number }) => {
      setPagination(page);
    },
    [setPagination],
  );

  const handleRowClick = useCallback(
    (record: IIncident) => {
      router.push(`/incidents/${record.id}`);
    },
    [router],
  );

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <DataTable
        columns={columns}
        dataSource={reports}
        loading={isLoading}
        pagination={{
          ...pagination,
          total: total,
        }}
        onChange={handleTableChange}
        emptyText={t("No incidents reported yet")}
        filter={<FormFilter />}
        onRowClick={handleRowClick}
      />
    </div>
  );
});

export default DataTableComponent;
