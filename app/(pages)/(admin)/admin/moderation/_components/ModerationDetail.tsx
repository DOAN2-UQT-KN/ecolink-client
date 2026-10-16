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
import { reportCategoryLabel, reportOutcomeOf } from "@/constants/reportVerification";
import { REPORT_OUTCOME_LABEL, REPORT_OUTCOME_TONE } from "@/constants/statusTone";
import { STATUS } from "@/constants/status";
import { formattedDate } from "@/utils/formattedDate";
import { cn } from "@/libs/utils";
import { useModerationContext } from "../_context/ModerationContext";
import { readContextEvidence, readDuplicateMatch, readTrustEvidence } from "../_services/evidence.service";
import { CheckCard, type EvidenceRow } from "./CheckCard";
import { DuplicateEvidence } from "./DuplicateEvidence";
import { ModerationDecision } from "./ModerationDecision";
import { RiskSummary } from "./RiskSummary";
import { VerificationHistory } from "./VerificationHistory";

const isRow = <T extends EvidenceRow>(row: T | false): row is T => row !== false;

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
  const categoryCode = context.category ?? report.category ?? "OTHER";
  const category = t(reportCategoryLabel(categoryCode) ?? "Other");
  const canDecide = report.status === STATUS.INREVIEW || (flag === "REJECT" && report.status === STATUS.INACTIVE);
  const outcome = reportOutcomeOf(report.status);

  const contextSummary =
    v.checks.context?.status !== "COMPLETED"
      ? null
      : context.verdict === "FIT"
        ? context.nearest
          ? t("Context: {{category}} fits the location, {{name}} {{distance}} m away.", {
              category: categoryCode,
              name: context.nearest.name,
              distance: Math.round(context.nearest.distanceM ?? 0),
            })
          : t("Context: {{category}} fits the location.", { category: categoryCode })
        : t("Context: {{category}} does not fit the location.", { category: categoryCode });

  const duplicateRows = match
    ? [
        match.phashDistance != null && { label: t("pHash distance"), value: t("{{n}} / 64 bit", { n: match.phashDistance }) },
        match.inliers != null && { label: t("ORB inliers"), value: match.inliers },
        match.distanceM != null && { label: t("Distance"), value: `${Math.round(match.distanceM)} m` },
        match.timeDeltaHours != null && { label: t("Time apart"), value: t("{{count}} h", { count: Math.round(match.timeDeltaHours) }) },
      ].filter(isRow)
    : [];
  const duplicateSummary = match
    ? [
        match.sameUser != null && (match.sameUser ? t("Same submitter") : t("Different submitter")),
        match.distanceM != null && t("{{distance}} m away", { distance: Math.round(match.distanceM) }),
        match.timeDeltaHours != null && t("sent {{count}} h apart", { count: Math.round(match.timeDeltaHours) }),
      ]
        .filter(Boolean)
        .join(", ") + "."
    : null;

  const trustTotal = trust.live != null && trust.gallery != null ? trust.live + trust.gallery : null;
  const trustRows = [
    trust.gallery != null && trustTotal != null && {
      label: t("Image source"),
      value: t("{{gallery}} / {{total}} library photos", { gallery: trust.gallery, total: trustTotal }),
    },
    trust.total90d != null && trust.rejected90d != null && {
      label: t("90-day history"),
      value: t("{{total}} reports, {{rejected}} rejected", { total: trust.total90d, rejected: trust.rejected90d }),
    },
    trust.accountAgeDays != null && { label: t("Account age"), value: t("{{days}} days", { days: trust.accountAgeDays }) },
  ].filter(isRow);

  const contextRows = [
    { label: t("Report type"), value: category },
    context.verdict != null && { label: t("Verdict"), value: context.verdict },
    context.nearest != null && {
      label: t("Nearest place"),
      value:
        context.nearest.distanceM != null
          ? `${context.nearest.name}, ${Math.round(context.nearest.distanceM)} m`
          : context.nearest.name,
    },
  ].filter(isRow);

  return (
    <div className="flex flex-col gap-4">
      <article className={card} aria-labelledby="moderation-report-title">
        <header className="flex flex-col gap-2">
          <h2 id="moderation-report-title" className={cn("font-display-5 font-semibold", isDark ? "text-zinc-100" : "text-foreground")}>
            {report.title || t("Untitled report")}
          </h2>
          <p className={cn("text-sm", muted)}>
            {[
              t("Submitted by {{name}} at {{time}}", {
                name: report.user?.name ?? t("Unknown user"),
                time: formattedDate(report.created_at, true),
              }),
              report.detail_address,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {outcome && (
              <Pill tone={REPORT_OUTCOME_TONE[outcome]} isDark={isDark}>
                {t(REPORT_OUTCOME_LABEL[outcome])}
              </Pill>
            )}
            <span className={cn("text-xs", muted)}>
              {t("Attempt {{n}} · engine {{engine}} · pipeline {{pipeline}}", {
                n: v.attempt,
                engine: v.versions.engine ?? "—",
                pipeline: v.versions.pipeline,
              })}
            </span>
          </div>
        </header>

        <RiskSummary verification={v} contextSummary={contextSummary} isDark={isDark} />

        <div className="grid gap-4 lg:grid-cols-3">
          <CheckCard name="duplicate" check={v.checks.duplicate} isDark={isDark} summary={duplicateSummary} rows={duplicateRows}>
            {match && <DuplicateEvidence report={report} match={match} isDark={isDark} />}
          </CheckCard>
          <CheckCard name="trust" check={v.checks.trust} isDark={isDark} rows={trustRows} />
          <CheckCard name="context" check={v.checks.context} isDark={isDark} rows={contextRows} />
        </div>

        {canDecide && <ModerationDecision reportId={report.id} isDark={isDark} />}
      </article>
      <VerificationHistory reportId={report.id} isDark={isDark} />
    </div>
  );
}
