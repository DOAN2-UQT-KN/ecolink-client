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
import { Button } from "@/components/client/shared/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS } from "@/constants/status";
import {
  isAdminOnlyReason,
  VERIFICATION_POLL_MAX_MS,
  VERIFICATION_POLL_MS,
  verificationStep,
  type VerificationOutcome,
} from "@/constants/reportVerification";
import StatusBanner from "./StatusBanner";
import VerificationStepper from "./VerificationStepper";
import IssueCard from "./IssueCard";
import VerificationActions from "./VerificationActions";

const MESSAGE: Record<VerificationOutcome, string> = {
  checking: "The system is checking your report. This usually takes a few seconds.",
  review: "A moderator will review your report.",
  accepted: "Your report is public and can be supported by others.",
  rejected: "Your report was not accepted. See the issues below.",
};

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

  const { data, error, isLoading, refetch } = useGetReportVerification(incident.id, {
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
    return <Skeleton className="h-40 w-full rounded-[10px]" />;
  }
  if (error && !isNotFoundError(error)) {
    return (
      <section className="flex w-full flex-col items-start gap-3 rounded-[10px] border border-button-accent-hover/40 bg-white/80 p-5">
        <p className="text-sm text-foreground-secondary">{t("Could not load verification")}</p>
        <Button variant="outlined-brown" onClick={() => refetch()}>
          {t("Try again")}
        </Button>
      </section>
    );
  }

  const progress = verificationStep(incident.status, verification);
  if (!progress) return null; // legacy report without verification

  const issues =
    progress.outcome === "review" || progress.outcome === "rejected"
      ? (verification?.issues ?? []).filter((i) => !isAdminOnlyReason(i.code))
      : [];

  const sortedIssues = [...issues].sort((a, b) => Number(b.primary) - Number(a.primary));

  return (
    <section
      aria-labelledby="verification-title"
      className="flex w-full flex-col gap-4 rounded-[10px] border border-button-accent-hover/40 bg-white/80 p-5 pb-24 sm:pb-5"
    >
      <StatusBanner
        outcome={progress.outcome}
        title={t(TITLE[progress.outcome])}
        message={
          progress.outcome === "review" && issues.length > 0
            ? t(
                "The system found {{count}} issue(s), so a moderator will review it. The report is not public in the meantime.",
                { count: issues.length },
              )
            : t(MESSAGE[progress.outcome])
        }
      />
      <VerificationStepper step={progress.step} outcome={progress.outcome} />
      {sortedIssues.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-display-4 font-semibold text-foreground-primary">{t("Detected issues")}</h3>
          {sortedIssues.map((issue) => (
            <IssueCard key={issue.code} issue={issue} incident={incident} />
          ))}
        </div>
      )}
      {(progress.outcome === "review" || progress.outcome === "rejected") && (
        <VerificationActions incident={incident} outcome={progress.outcome} />
      )}
    </section>
  );
}
