import { useEffect, useMemo } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "@/libs/router";
import { useGetReportDetail } from "@/apis/incident/getReportDetail";
import ReportDetailCard from "@/modules/ReportDetailCard/ReportDetailCard";
import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { verificationStep } from "@/constants/reportVerification";
import { useTranslation } from "react-i18next";
import useAuthStore from "@/stores/useAuthStore";
import VerificationPanel from "./_components/VerificationPanel";
import NotFound from "@/src/pages/NotFound";

const PAGE_CLASS = "max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10";

/** Report detail (specs/009): the owner gets Information / Moderation tabs, everyone else the card. */
const IncidentDetailPage = () => {
  const { id } = useParams() as { id: string };
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useGetReportDetail(id);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const incident = data?.data?.report;
  // Same rule as VerificationPanel, so the Moderation tab is never empty (research R1).
  const showTabs =
    !!incident &&
    !!currentUserId &&
    incident.user_id === currentUserId &&
    verificationStep(incident.status, incident.latest_verification) !== null;
  const tab = searchParams.get("tab") === "moderation" && showTabs ? "moderation" : "information";

  const replaceTab = (next: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("tab", next);
    else params.delete("tab");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // A Moderation link opened by someone who cannot see it falls back to Information (FR-009).
  const staleTab = !!incident && !showTabs && searchParams.has("tab");
  useEffect(() => {
    if (staleTab) replaceTab(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the link turns stale
  }, [staleTab]);

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
      <div className={PAGE_CLASS}>
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="space-y-4 pt-5">
          <Skeleton className="h-10 w-full sm:w-64 rounded-[8px]" />
          <Skeleton className="h-96 w-full rounded-[10px]" />
        </div>
      </div>
    );
  }

  // Rejected reports (status 2) come back only to their owner and admins (BR-103); others get 404.
  if (isError || !incident) {
    return <NotFound />;
  }

  const card = (
    <ReportDetailCard incident={incident} isExpanded linkToDetail={false} className="mx-0 max-w-none" />
  );

  return (
    <div className={`${PAGE_CLASS} animate-in fade-in duration-500`}>
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <div className="pt-5">
        {showTabs ? (
          <Tabs value={tab} onValueChange={(v) => replaceTab(v === "moderation" ? v : null)}>
            <TabsList className="w-full sm:w-auto border border-[rgba(136,122,71,0.5)] rounded-[8px] bg-background-primary/10 mb-4">
              {(["information", "moderation"] as const).map((value) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-[8px] px-4 py-2 h-full data-active:bg-background data-active:shadow-sm transition-all !font-display-1"
                >
                  {t(value === "information" ? "Information" : "Moderation")}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="information" className="mt-0">
              {card}
            </TabsContent>
            <TabsContent value="moderation" className="mt-0">
              <VerificationPanel incident={incident} />
            </TabsContent>
          </Tabs>
        ) : (
          card
        )}
      </div>
    </div>
  );
};

export default IncidentDetailPage;
