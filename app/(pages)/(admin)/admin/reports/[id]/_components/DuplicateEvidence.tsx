import { Image as AntdImage } from "antd";
import { useTranslation } from "react-i18next";
import { TbChevronRight } from "react-icons/tb";
import { useGetReportDetail } from "@/apis/incident/getReportDetail";
import type { IIncident } from "@/apis/incident/models/incident";
import { Link } from "@/libs/router";
import { reportOutcomeOf, shortReportCode } from "@/constants/reportVerification";
import { REPORT_OUTCOME_LABEL, STATUS_LABEL } from "@/constants/statusTone";
import type { STATUS } from "@/constants/status";
import { cn } from "@/libs/utils";
import type { ReportMatch } from "../_services/evidence.service";

const imagesOf = (report?: IIncident) => report?.image_urls || report?.media_files?.map((m) => m.url) || [];

/** The report under review next to the report it matched (specs/007 FR-020); numbers are in the card rows. */
export function DuplicateEvidence({
  report,
  match,
  isDark,
}: {
  report: IIncident;
  match: ReportMatch;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const { data } = useGetReportDetail(match.reportId);
  const matched = data?.data?.report;
  const ours = imagesOf(report)[match.imageIndex ?? 0];
  // shortcut: duplicate evidence has no matched media id, so this shows the matched report's first
  // image; switch when ai-service returns matched_media_id.
  const theirs = imagesOf(matched)[0];

  const outcome = reportOutcomeOf(matched?.status);
  const statusLabel = outcome
    ? REPORT_OUTCOME_LABEL[outcome]
    : matched?.status != null
      ? STATUS_LABEL[matched.status as STATUS]
      : undefined;
  const code = shortReportCode(match.reportId);
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";

  const tile = (url: string | undefined, label: string, caption: string) => (
    <figure className="flex min-w-0 flex-col gap-1.5">
      {url ? (
        <AntdImage src={url} alt={label} className="aspect-square w-full rounded-md object-cover" />
      ) : (
        <div className={cn("aspect-square w-full rounded-md", isDark ? "bg-zinc-700" : "bg-muted")} />
      )}
      <figcaption className={cn("truncate text-xs", muted)}>{caption}</figcaption>
    </figure>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <AntdImage.PreviewGroup>
          {tile(ours, t("This report"), t("Report under review"))}
          {tile(theirs, t("Matched report {{code}}", { code }), statusLabel ? `${code}, ${t(statusLabel).toLowerCase()}` : code)}
        </AntdImage.PreviewGroup>
      </div>
      <Link
        href={`/incidents/${match.reportId}`}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
          isDark
            ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus-visible:ring-zinc-400"
            : "bg-muted text-foreground hover:bg-accent focus-visible:ring-ring",
        )}
      >
        {t("Open matched report")}
        <TbChevronRight aria-hidden className="size-4 shrink-0" />
      </Link>
    </div>
  );
}
