"use client";

import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

import { OrganizationCard } from "@/modules/OrganizationCard/OrganizationCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useOrganizationSearch } from "../_context/OrganizationSearchContext";

export const OrganizationList = memo(function OrganizationList() {
  const { t } = useTranslation();
  const { organizations, isLoading, total, pagination, setPagination } =
    useOrganizationSearch();

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPagination({ ...pagination, current: newPage });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [pagination, setPagination],
  );

  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-full border border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 overflow-hidden space-y-4 p-4"
            >
              <Skeleton className="h-28 w-full rounded-t-[10px]" />
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-20 w-20 rounded-full -mt-10" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex justify-center pt-12 pb-20">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="h-12 w-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t("No organizations found")}</EmptyTitle>
            <EmptyDescription>
              {t(
                "Try adjusting your search or sort options to find organizations.",
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {organizations.map((org) => (
          <OrganizationCard
            key={org.id}
            name={org.name}
            description={org.description ?? ""}
            logoUrl={org.logo_url ?? ""}
            backgroundUrl={org.background_url ?? ""}
            contactEmail={org.contact_email ?? ""}
            className="h-full"
            listingMode
            organizationId={org.id}
            requestStatus={org.request_status}
            joinRequestId={org.join_request_id}
            ownerId={org.owner_id}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-2 py-6 border-t border-border/50">
          <button
            type="button"
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
            type="button"
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
});
