import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  isNotFoundError,
  useGetReportVerification,
} from "@/apis/incident/getReportVerification";
import {
  isAdminVerification,
  type IUserVerification,
} from "@/apis/incident/models/verification";
import type { IIncident } from "@/apis/incident/models/incident";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS } from "@/constants/status";
import {
  isAdminOnlyReason,
  VERIFICATION_POLL_MAX_MS,
  VERIFICATION_POLL_MS,
  verificationStep,
  type VerificationOutcome,
} from "@/constants/reportVerification";
import { REPORT_OUTCOME_LABEL, REPORT_OUTCOME_TONE } from "@/constants/statusTone";
import VerificationStepper from "./VerificationStepper";
import IssueCard from "./IssueCard";
import VerificationActions from "./VerificationActions";

const TITLE: Record<VerificationOutcome, string> = {
  checking: "The system is checking your report",
  review: "Your report is waiting for review",
  accepted: "Report accepted",
  rejected: "Report not accepted",
};

/** Owner-only verification status of a report (specs/007 US2). */
export default function VerificationPanel({ incident }: { incident: IIncident }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [mountedAt] = useState(() => Date.now());

  const { data, error, isLoading } = useGetReportVerification(incident.id, {
    // shortcut: stops polling after 10 min (the legacy flow never creates an attempt); drop when
    // REPORT_VERIFICATION_ENABLED is on everywhere.
    refetchInterval: (query) => {
      if (Date.now() - mountedAt > VERIFICATION_POLL_MAX_MS) return false;
      const running = query.state.data?.data?.verification?.status === "RUNNING";
      return incident.status === STATUS.PENDING || running ? VERIFICATION_POLL_MS : false;
    },
  });

  const raw = data?.data?.verification;
  // An admin viewing their own report gets the admin view; this panel only reads the public part.
  const verification: IUserVerification | undefined =
    raw && !isAdminVerification(raw) ? raw : undefined;

  // Once the attempt finishes, refresh the report so its status (12 → 9/21/2) catches up.
  const flagRef = useRef(verification?.flag ?? null);
  useEffect(() => {
    const flag = verification?.flag ?? null;
    if (flag && flag !== flagRef.current) {
      queryClient.invalidateQueries({ queryKey: ["report-detail", incident.id] });
    }
    flagRef.current = flag;
  }, [verification?.flag, incident.id, queryClient]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full max-w-2xl rounded-[10px]" />;
  }
  if (error && !isNotFoundError(error)) return null;

  const progress = verificationStep(incident.status, verification);
  if (!progress) return null; // legacy report without verification

  const issues =
    progress.outcome === "review" || progress.outcome === "rejected"
      ? (verification?.issues ?? []).filter((i) => !isAdminOnlyReason(i.code))
      : [];

  return (
    <section
      aria-labelledby="verification-title"
      className="flex w-full max-w-2xl flex-col gap-4 rounded-[10px] border border-button-accent-hover/40 bg-white/80 p-5 pb-24 sm:pb-5"
    >
      <VerificationStepper step={progress.step} />
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <h2 id="verification-title" className="font-display-5 font-semibold text-button-accent">
          {t(TITLE[progress.outcome])}
        </h2>
        <Pill tone={REPORT_OUTCOME_TONE[progress.outcome]}>
          {t(REPORT_OUTCOME_LABEL[progress.outcome])}
        </Pill>
      </div>
      {progress.outcome === "review" && issues.length > 0 && (
        <p className="text-sm text-foreground-secondary">
          {t(
            "The system found {{count}} issue(s), so a moderator will review it. The report is not public in the meantime.",
            { count: issues.length },
          )}
        </p>
      )}
      {issues.length > 0 && (
        <div className="flex flex-col gap-3">
          {issues.map((issue) => (
            <IssueCard key={issue.code} issue={issue} />
          ))}
        </div>
      )}
      {(progress.outcome === "review" || progress.outcome === "rejected") && (
        <VerificationActions incident={incident} outcome={progress.outcome} issues={issues} />
      )}
    </section>
  );
}
