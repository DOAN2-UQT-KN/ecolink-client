"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useGetReportDetail } from "@/apis/incident/getReportDetail";
import ReportDetailCard from "@/modules/ReportDetailCard/ReportDetailCard";
import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/shared/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { Inbox } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const IncidentDetailPage = () => {
  const { id } = useParams() as { id: string };
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetReportDetail(id);

  const incident = data?.data?.report;

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Home"), path: "/", type: "link" },
      { label: t("My incidents"), path: "/incidents/me", type: "link" },
      {
        label: incident?.title || t("Incident Detail"),
        path: `/incidents/${id}`,
        type: "page",
      },
    ],
    [t, incident, id],
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="flex justify-center pt-10">
          <div className="w-full max-w-md space-y-4 bg-card rounded-2xl p-5 border border-border/50">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !incident) {
    return (
      <div className="">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="flex justify-center pt-20">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t("Incident not found")}</EmptyTitle>
              <EmptyDescription>
                {t("We couldn't find the incident you were looking for.")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <div className="flex justify-center pt-3 animate-in fade-in zoom-in-95 duration-500">
        <ReportDetailCard incident={incident} />
      </div>
    </div>
  );
};

export default IncidentDetailPage;
