import { Image as AntdImage } from "antd";
import { useTranslation } from "react-i18next";
import { useGetReportDetail } from "@/apis/incident/getReportDetail";
import type { IIncident } from "@/apis/incident/models/incident";
import { Link } from "@/libs/router";
import { shortReportCode } from "@/constants/reportVerification";
import { cn } from "@/libs/utils";
import type { DuplicateMatch } from "../_services/evidence.service";

const imagesOf = (report?: IIncident) => report?.image_urls || report?.media_files?.map((m) => m.url) || [];

/** The report under review next to the report it matched (specs/007 FR-020). */
export function DuplicateEvidence({
  report,
  match,
  isDark,
}: {
  report: IIncident;
  match: DuplicateMatch;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const { data } = useGetReportDetail(match.reportId);
  const ours = imagesOf(report)[match.imageIndex ?? 0];
  // shortcut: duplicate evidence has no matched media id, so this shows the matched report's first
  // image; switch when ai-service returns matched_media_id.
  const theirs = imagesOf(data?.data?.report)[0];

  const facts = [
    match.phashDistance != null && t("pHash distance {{n}}", { n: match.phashDistance }),
    match.inliers != null && t("{{n}} ORB inliers", { n: match.inliers }),
    match.distanceM != null && t("{{distance}} m away", { distance: Math.round(match.distanceM) }),
    match.timeDeltaHours != null && t("{{count}} h apart", { count: Math.round(match.timeDeltaHours) }),
    match.sameUser != null && (match.sameUser ? t("Same submitter") : t("Different submitter")),
  ].filter(Boolean);

  const tile = (url: string | undefined, label: string) => (
    <figure className="flex min-w-0 flex-col gap-1">
      {url ? (
        <AntdImage src={url} alt={label} className="aspect-square w-full rounded-md object-cover" />
      ) : (
        <div className={cn("aspect-square w-full rounded-md", isDark ? "bg-zinc-700" : "bg-muted")} />
      )}
      <figcaption className={cn("text-xs", isDark ? "text-zinc-400" : "text-muted-foreground")}>{label}</figcaption>
    </figure>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <AntdImage.PreviewGroup>
          {tile(ours, t("This report"))}
          {tile(theirs, t("Matched report {{code}}", { code: shortReportCode(match.reportId) }))}
        </AntdImage.PreviewGroup>
      </div>
      {facts.length > 0 && <p className="text-xs">{facts.join(" · ")}</p>}
      <Link href={`/incidents/${match.reportId}`} className="text-xs font-medium text-button-accent underline">
        {t("Open matched report")}
      </Link>
    </div>
  );
}
