import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { TbAlertTriangle, TbChevronRight, TbCopy, TbExternalLink, TbMapPin, TbPhoto } from "react-icons/tb";
import { useGetReportDetail } from "@/apis/incident/getReportDetail";
import type { IIncident } from "@/apis/incident/models/incident";
import type { IVerificationIssue } from "@/apis/incident/models/verification";
import { reasonCopy, reportCategoryLabel, shortReportCode } from "@/constants/reportVerification";
import { Link } from "@/libs/router";
import DuplicatePhotos, { WebPhotos } from "./DuplicatePhotos";

const httpsOrNull = (v?: string | null) => (v?.startsWith("https://") ? v : null);
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};
const rowButton =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 font-semibold text-foreground-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent";

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
 * the similar report, never naming its sender (FR-019); a web match shows the web image and its page.
 */
export default function IssueCard({ issue, incident }: { issue: IVerificationIssue; incident: IIncident }) {
  const { t } = useTranslation();
  const copy = reasonCopy(issue.code);
  const { similar_report_id, distance_m, time_delta_hours, nearest, image_index, source_url, page_url, page_title, suggested_categories } =
    issue.evidence ?? {};
  const webSource = issue.code === "DUP_WEB_IMAGE_MATCH" ? httpsOrNull(source_url) : null;
  const webPage = webSource ? httpsOrNull(page_url) : null;
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
          {issue.code.startsWith("CTX_") && !!suggested_categories?.length && (
            <p className="text-sm text-foreground-secondary">
              {t("Types that fit this location: {{types}}", {
                types: suggested_categories
                  .map((c) => {
                    const label = t(reportCategoryLabel(c.category) ?? c.category);
                    return c.nearest?.name
                      ? `${label} (${c.nearest.name}, ${Math.round(c.nearest.distance_m ?? 0)} m)`
                      : label;
                  })
                  .join(", "),
              })}
            </p>
          )}
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
              <Link href={`/incidents/${similarId}`} className={rowButton}>
                {t("View similar report")}
                <TbChevronRight aria-hidden className="size-4 shrink-0" />
              </Link>
            )}
          </>
        )}
        {webSource && (
          <>
            <WebPhotos
              own={incident}
              imageIndex={image_index ?? 0}
              sourceUrl={webSource}
              caption={page_title || hostOf(webPage ?? webSource)}
            />
            {webPage && (
              <a href={webPage} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={rowButton}>
                <span className="flex min-w-0 items-baseline gap-2">
                  {t("Open source page")}
                  <span className="truncate text-xs font-normal text-foreground-tertiary">{hostOf(webPage)}</span>
                </span>
                <TbExternalLink aria-hidden className="size-4 shrink-0" />
              </a>
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
