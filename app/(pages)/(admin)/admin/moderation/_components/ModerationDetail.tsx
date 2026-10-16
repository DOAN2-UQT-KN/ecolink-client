import { useTranslation } from "react-i18next";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { useGetReportDetail } from "@/apis/incident/getReportDetail";
import {
  isNotFoundError,
  useGetReportVerification,
} from "@/apis/incident/getReportVerification";
import { isAdminVerification } from "@/apis/incident/models/verification";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { reportCategoryLabel, shortReportCode } from "@/constants/reportVerification";
import { RISK_FLAG_TONE } from "@/constants/statusTone";
import { STATUS } from "@/constants/status";
import { formattedDate } from "@/utils/formattedDate";
import { cn } from "@/libs/utils";
import { useModerationContext } from "../_context/ModerationContext";
import { readContextEvidence, readDuplicateMatch, readTrustEvidence } from "../_services/evidence.service";
import { CheckCard } from "./CheckCard";
import { DuplicateEvidence } from "./DuplicateEvidence";
import { ModerationDecision } from "./ModerationDecision";
import { VerificationHistory } from "./VerificationHistory";

export function ModerationDetail({ reportId }: { reportId: string }) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";
  const { flag } = useModerationContext();
  const verificationQuery = useGetReportVerification(reportId);
  const detailQuery = useGetReportDetail(reportId);

  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";
  const card = cn("flex flex-col gap-4 rounded-[10px] border p-5", isDark ? "border-zinc-700 bg-zinc-900" : "border-border bg-card");

  if (verificationQuery.isLoading || detailQuery.isLoading) {
    return <Skeleton className="h-96 w-full rounded-[10px]" />;
  }

  const raw = verificationQuery.data?.data?.verification;
  const report = detailQuery.data?.data?.report;
  if (!raw || !isAdminVerification(raw) || !report) {
    return (
      <Empty className={card}>
        <EmptyHeader>
          <EmptyTitle>
            {isNotFoundError(verificationQuery.error)
              ? t("This report has no verification yet")
              : t("Could not load this report")}
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  const v = raw;
  const match = readDuplicateMatch(v.checks.duplicate?.evidence);
  const trust = readTrustEvidence(v.checks.trust?.evidence);
  const context = readContextEvidence(v.checks.context?.evidence);
  const category = t(reportCategoryLabel(context.category ?? report.category) ?? "Other");
  const canDecide = report.status === STATUS.INREVIEW || (flag === "REJECT" && report.status === STATUS.INACTIVE);

  const trustTotal = trust.live != null && trust.gallery != null ? trust.live + trust.gallery : null;
  const trustFacts = [
    trust.gallery != null && trustTotal != null && t("{{gallery}}/{{total}} gallery photos", { gallery: trust.gallery, total: trustTotal }),
    trust.rejected90d != null && trust.total90d != null &&
      t("{{rejected}}/{{total}} rejected in 90 days", { rejected: trust.rejected90d, total: trust.total90d }),
    trust.accountAgeDays != null && t("account {{days}} days old", { days: trust.accountAgeDays }),
  ].filter(Boolean);

  const contextSummary =
    v.checks.context?.status !== "COMPLETED"
      ? null
      : context.verdict === "FIT"
        ? context.nearest
          ? t("{{category}} fits the location, {{name}} {{distance}} m away", {
              category,
              name: context.nearest.name,
              distance: Math.round(context.nearest.distanceM ?? 0),
            })
          : t("{{category}} fits the location", { category })
        : t("{{category}} does not fit the location", { category });

  return (
    <article className={card} aria-labelledby="moderation-report-title">
      <header className="flex flex-col gap-1">
        <h2 id="moderation-report-title" className={cn("font-display-5 font-semibold", isDark ? "text-zinc-100" : "text-foreground")}>
          {report.title || t("Untitled report")}
        </h2>
        <p className={cn("text-sm", muted)}>
          {[shortReportCode(report.id), report.user?.name, formattedDate(report.created_at, true), report.detail_address]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className={cn("text-xs", muted)}>
          {t("Attempt {{n}} · engine {{engine}} · pipeline {{pipeline}}", {
            n: v.attempt,
            engine: v.versions.engine ?? "—",
            pipeline: v.versions.pipeline,
          })}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{t("Total score")}</span>
        <span className="font-mono text-2xl">{v.risk_score != null ? v.risk_score.toFixed(2) : "—"}</span>
        {v.flag && (
          <Pill tone={RISK_FLAG_TONE[v.flag]} isDark={isDark}>
            {v.flag}
          </Pill>
        )}
      </div>
      {contextSummary && <p className="text-sm">{contextSummary}</p>}

      <div className="grid gap-3 lg:grid-cols-3">
        <CheckCard name="duplicate" check={v.checks.duplicate} isDark={isDark}>
          {match && <DuplicateEvidence report={report} match={match} isDark={isDark} />}
        </CheckCard>
        <CheckCard name="trust" check={v.checks.trust} isDark={isDark}>
          {trustFacts.length > 0 && <p className="text-xs">{trustFacts.join(" · ")}</p>}
        </CheckCard>
        <CheckCard name="context" check={v.checks.context} isDark={isDark}>
          {context.nearest && (
            <p className="text-xs">
              {t("Nearest place: {{name}}, {{distance}} m", {
                name: context.nearest.name,
                distance: Math.round(context.nearest.distanceM ?? 0),
              })}
            </p>
          )}
        </CheckCard>
      </div>

      <VerificationHistory reportId={report.id} isDark={isDark} />
      {canDecide && <ModerationDecision reportId={report.id} isDark={isDark} />}
    </article>
  );
}
