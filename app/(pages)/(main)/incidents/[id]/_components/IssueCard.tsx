import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { TbAlertTriangle, TbChevronRight, TbCopy, TbMapPin, TbPhoto } from "react-icons/tb";
import { useGetReportDetail } from "@/apis/incident/getReportDetail";
import type { IIncident } from "@/apis/incident/models/incident";
import type { IVerificationIssue } from "@/apis/incident/models/verification";
import { reasonCopy, shortReportCode } from "@/constants/reportVerification";
import { Link } from "@/libs/router";
import DuplicatePhotos from "./DuplicatePhotos";

const iconFor = (code: string): IconType =>
  code.startsWith("DUP_")
    ? TbCopy
    : code === "TRUST_NOT_LIVE_CAPTURE"
      ? TbPhoto
      : code.startsWith("CTX_")
        ? TbMapPin
        : TbAlertTriangle;

/**
 * One problem found by verification (specs/010 FR-012). A duplicate shows both photos and links to
 * the similar report; never names that report's sender (FR-019).
 */
export default function IssueCard({ issue, incident }: { issue: IVerificationIssue; incident: IIncident }) {
  const { t } = useTranslation();
  const copy = reasonCopy(issue.code);
  const { similar_report_id, distance_m, time_delta_hours, nearest } = issue.evidence ?? {};
  const similarId = issue.code.startsWith("DUP_") && similar_report_id ? similar_report_id : null;
  const similarQuery = useGetReportDetail(similarId ?? "", {
    enabled: !!similarId,
    retry: false,
    silentError: true,
  });
  const similar = similarQuery.data?.data?.report;
  const Icon = iconFor(issue.code);

  let description = t(copy.description);
  if (similarId && (distance_m != null || time_delta_hours != null)) {
    const parts = [
      distance_m != null ? t("{{distance}} m away", { distance: Math.round(distance_m) }) : null,
      time_delta_hours != null
        ? time_delta_hours < 24
          ? t("sent {{count}} h apart", { count: Math.round(time_delta_hours) })
          : t("sent {{count}} days apart", { count: Math.round(time_delta_hours / 24) })
        : null,
    ].filter(Boolean);
    description = t("A similar report ({{facts}}) uses an almost identical photo.", { facts: parts.join(", ") });
  } else if (issue.code.startsWith("CTX_") && nearest?.name) {
    description = `${description} ${
      nearest.distance_m != null
        ? t("Nearest place: {{name}}, {{distance}} m", { name: nearest.name, distance: Math.round(nearest.distance_m) })
        : t("Nearest place: {{name}}", { name: nearest.name })
    }`;
  }

  return (
    <article className="flex gap-3 rounded-[10px] border border-button-accent-hover/40 bg-white/80 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground-secondary">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          {issue.primary && (
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
              {t("Main reason")}
            </span>
          )}
          <h4 className="font-display-3 font-semibold text-foreground-primary">{t(copy.title)}</h4>
          <p className="text-sm text-foreground-secondary">{description}</p>
        </div>
        {similarId && (
          <>
            <DuplicatePhotos
              own={incident}
              similar={similar}
              similarCode={shortReportCode(similarId)}
              isLoading={similarQuery.isLoading}
              isError={similarQuery.isError || (!similarQuery.isLoading && !similar)}
            />
            {similar && (
              <Link
                href={`/incidents/${similarId}`}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 font-semibold text-foreground-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent"
              >
                {t("View similar report")}
                <TbChevronRight aria-hidden className="size-4 shrink-0" />
              </Link>
            )}
          </>
        )}
        {copy.fix && (
          <p className="rounded-lg bg-muted/60 p-3 text-sm text-foreground-primary">
            <strong>{t("How to fix")}:</strong> {t(copy.fix)}
          </p>
        )}
        <span className="font-mono text-xs text-foreground-tertiary">{issue.code}</span>
      </div>
    </article>
  );
}
