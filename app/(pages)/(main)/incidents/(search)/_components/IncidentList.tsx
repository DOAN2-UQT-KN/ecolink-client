"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useIncidentSearch } from "../_context/IncidentSearchContext";
import ReportDetailCard from "@/modules/ReportDetailCard/ReportDetailCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Inbox } from "lucide-react";
import { DataTableProps, PaginationProps } from "@/components/shared/DataTable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/libs/utils";

export const IncidentList = () => {
  const { t } = useTranslation();
  const {
    reports,
    isLoading,
    total,
    pagination,
    setPagination,
  } = useIncidentSearch();

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, current: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(total / pagination.pageSize);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-full bg-card rounded-[15px] border border-border/50 p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex-1 flex justify-center pt-20">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="h-12 w-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t("No incidents found")}</EmptyTitle>
            <EmptyDescription>
              {t(
                "Try adjusting your search or filters to find what you're looking for.",
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 pb-10 ">
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {reports.map((incident) => (
          <ReportDetailCard key={incident.id} incident={incident} />
        ))}
      </div>

      {/* Custom Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-2 py-6 border-t border-border/50">
          <button
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current <= 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-xl border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            {t("Previous")}
          </button>

          <span className="text-sm font-medium text-foreground-secondary">
            {t("Page")} {pagination.current} {t("of")} {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={pagination.current >= totalPages}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-xl border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("Next")}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
