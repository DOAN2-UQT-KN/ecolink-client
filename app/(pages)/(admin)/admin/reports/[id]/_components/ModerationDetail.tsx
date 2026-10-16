import { useTranslation } from "react-i18next";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import {
  isNotFoundError,
  useGetReportVerification,
} from "@/apis/incident/getReportVerification";
import { isAdminVerification } from "@/apis/incident/models/verification";
import type { IIncident } from "@/apis/incident/models/incident";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { canModerate, reportCategoryLabel } from "@/constants/reportVerification";
import { cn } from "@/libs/utils";
import { readContextEvidence, readDuplicateMatch, readTrustEvidence } from "../_services/evidence.service";
import { CheckCard, type EvidenceRow } from "./CheckCard";
import { DuplicateEvidence } from "./DuplicateEvidence";
import { ModerationDecision } from "./ModerationDecision";
import { RiskSummary } from "./RiskSummary";
import { VerificationHistory } from "./VerificationHistory";

const isRow = <T extends EvidenceRow>(row: T | false): row is T => row !== false;

/** Moderation tab of the admin report detail (specs/008 US3): scores, checks, history, decision. */
export function ModerationDetail({ report, onDecided }: { report: IIncident; onDecided: () => void }) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";
  const verificationQuery = useGetReportVerification(report.id);

  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";
  const card = cn("flex flex-col gap-4 rounded-[10px] border p-5", isDark ? "border-zinc-700 bg-zinc-900" : "border-border bg-card");

  if (verificationQuery.isLoading) {
    return <Skeleton className="h-96 w-full rounded-[10px]" />;
  }

  const raw = verificationQuery.data?.data?.verification;
  if (!raw || !isAdminVerification(raw)) {
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
  const canDecide = canModerate(report);

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
        match.sameUser != null && { label: t("Submitter"), value: match.sameUser ? t("Same submitter") : t("Different submitter") },
      ].filter(isRow)
    : [];
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
      <article className={card} aria-label={t("Moderation")}>
        <p className={cn("text-xs", muted)}>
          {t("Attempt {{n}} · engine {{engine}} · pipeline {{pipeline}}", {
            n: v.attempt,
            engine: v.versions.engine ?? "—",
            pipeline: v.versions.pipeline,
          })}
        </p>

        <RiskSummary verification={v} contextSummary={contextSummary} isDark={isDark} />

        <div className="grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))] lg:grid-rows-[auto_1fr_auto]">
          <CheckCard name="duplicate" check={v.checks.duplicate} isDark={isDark} rows={duplicateRows}>
            {match && <DuplicateEvidence report={report} match={match} isDark={isDark} />}
          </CheckCard>
          <CheckCard name="trust" check={v.checks.trust} isDark={isDark} rows={trustRows} />
          <CheckCard name="context" check={v.checks.context} isDark={isDark} rows={contextRows} />
        </div>

        {canDecide && <ModerationDecision reportId={report.id} isDark={isDark} onDecided={onDecided} />}
      </article>
      <VerificationHistory reportId={report.id} isDark={isDark} />
    </div>
  );
}
