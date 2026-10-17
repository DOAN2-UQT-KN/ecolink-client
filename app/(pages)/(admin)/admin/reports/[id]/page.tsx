import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { TbArrowLeft, TbArrowRight } from "react-icons/tb";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { useGetIncidents } from "@/apis/incident/getIncidents";
import { useGetReportDetail } from "@/apis/incident/getReportDetail";
import { isNotFoundError } from "@/apis/incident/getReportVerification";
import { Breadcrumbs, type BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/components/ui/StatusTag";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reportOutcomeOf, shortReportCode } from "@/constants/reportVerification";
import { REPORT_OUTCOME_LABEL, REPORT_OUTCOME_TONE } from "@/constants/statusTone";
import { Link, useParams, usePathname, useRouter, useSearchParams } from "@/libs/router";
import { cn } from "@/libs/utils";
import { ReportInformation } from "./_components/ReportInformation";
import { ModerationDetail } from "./_components/ModerationDetail";

type Tab = "information" | "moderation";
type QueueFlag = "REVIEW" | "REJECT";

const parseFlag = (value: string | null): QueueFlag | undefined =>
  value === "REVIEW" || value === "REJECT" ? value : undefined;

/** Admin report detail (specs/008): Information, plus Moderation when the report has a verification. */
export default function AdminReportDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";

  // Where the admin came from, so "Back" and "Next report" stay in the same filtered list.
  const from = parseFlag(searchParams.get("from"));
  const listPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const listLimit = Math.max(1, Number(searchParams.get("limit")) || 10);
  const backHref = from ? `/admin/reports?moderation=${from}&page=${listPage}&limit=${listLimit}` : "/admin/reports";

  const { data, isLoading, error } = useGetReportDetail(id, { retry: false });
  const report = data?.data?.report;
  const hasModeration = !!report?.latest_verification;
  const tab: Tab = searchParams.get("tab") === "moderation" && hasModeration ? "moderation" : "information";

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "moderation") params.set("tab", "moderation");
    else params.delete("tab");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // A Moderation link for a report without a verification falls back to Information (FR-010).
  useEffect(() => {
    if (report && !hasModeration && searchParams.get("tab") === "moderation") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tab");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [hasModeration, pathname, report, router, searchParams]);

  // "Next report" (US4): once decided, the first other report of the same filter and page.
  const [decidedId, setDecidedId] = useState<string | null>(null);
  const decided = decidedId === id;
  const { data: nextData } = useGetIncidents(
    { moderation: from, page: listPage, limit: listLimit },
    { enabled: decided && !!from },
  );
  const nextId = nextData?.data?.reports?.find((r) => r.id !== id)?.id;

  const onDecided = () => {
    setDecidedId(id);
    queryClient.invalidateQueries({ queryKey: ["report-detail", id] });
  };

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Dashboard"), path: "/admin", type: "link" },
      { label: t("Reports"), path: backHref, type: "link" },
      { label: report?.title || t("Report detail"), path: pathname, type: "page" },
    ],
    [backHref, pathname, report?.title, t],
  );

  // const back = (
  //   <Button variant="ghost" className="w-fit" asChild>
  //     <Link href={backHref}>
  //       <TbArrowLeft aria-hidden />
  //       {t("Back to list")}
  //     </Link>
  //   </Button>
  // );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
        <Skeleton className="h-96 w-full rounded-[10px]" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-2">
        <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {!error || isNotFoundError(error) ? t("Report not found") : t("Could not load this report")}
            </EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="ghost" className="w-fit" asChild>
              <Link href={backHref}>
                <TbArrowLeft aria-hidden />
                {t("Back to list")}
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const outcome = reportOutcomeOf(report.status);

  return (
    <div className="space-y-2">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* {back} */}
        {decided && nextId && from && (
          <Button variant="outline" asChild>
            <Link href={`/admin/reports/${nextId}?tab=moderation&from=${from}&page=${listPage}&limit=${listLimit}`}>
              {t("Next report")}
              <TbArrowRight aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      <header className="flex flex-wrap items-center gap-3">
        <h2 className={cn("font-display-5 font-semibold", isDark ? "text-zinc-100" : "text-foreground")}>
          {report.title || t("Untitled report")}
        </h2>
        {outcome && (report.latest_verification || outcome !== "rejected") ? (
          <Pill tone={REPORT_OUTCOME_TONE[outcome]} isDark={isDark}>
            {t(REPORT_OUTCOME_LABEL[outcome])}
          </Pill>
        ) : (
          <StatusTag status={report.status} isDark={isDark} />
        )}
        <span className={cn("font-mono text-xs", isDark ? "text-zinc-400" : "text-muted-foreground")}>
          {shortReportCode(report.id)}
        </span>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="information">{t("Information")}</TabsTrigger>
          {hasModeration && <TabsTrigger value="moderation">{t("Moderation")}</TabsTrigger>}
        </TabsList>
        <TabsContent value="information" className="pt-4">
          <ReportInformation report={report} isDark={isDark} />
        </TabsContent>
        {hasModeration && (
          <TabsContent value="moderation" className="pt-4">
            <ModerationDetail key={id} report={report} onDecided={onDecided} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
