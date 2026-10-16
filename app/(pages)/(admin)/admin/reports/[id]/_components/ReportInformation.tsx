import type { ReactNode } from "react";
import { Image as AntdImage } from "antd";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { TbExternalLink } from "react-icons/tb";
import type { IIncident } from "@/apis/incident/models/incident";
import AppImage from "@/components/ui/AppImage";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { reportCategoryLabel } from "@/constants/reportVerification";
import { formattedDate } from "@/utils/formattedDate";
import { ConditionCell, SeverityCell, WasteTypeCell } from "@/modules/ReportGeneralInformation";
import { cn } from "@/libs/utils";
import defaultAvatar from "@/public/default-avatar.png";

const imagesOf = (report: IIncident) => report.image_urls || report.media_files?.map((m) => m.url) || [];

/** Everything the reporter sent, plus who handles it (specs/008 US2, FR-009). Empty fields read "—". */
export function ReportInformation({ report, isDark }: { report: IIncident; isDark: boolean }) {
  const { t } = useTranslation();
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";
  const strong = isDark ? "text-zinc-100" : "text-foreground";
  const dash = <span className={muted}>—</span>;
  const images = imagesOf(report);
  const hasPoint = report.latitude != null && report.longitude != null;
  const category = reportCategoryLabel(report.category);

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: t("Description"),
      value: report.description ? (
        <RichTextContent value={report.description} className={cn("text-sm", strong)} />
      ) : (
        dash
      ),
    },
    {
      label: t("Address"),
      value: (
        <div className="flex flex-col gap-0.5">
          <span>{report.detail_address || "—"}</span>
          {hasPoint && (
            <span className={cn("flex flex-wrap items-center gap-2 text-xs", muted)}>
              <span className="font-mono">
                {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
              </span>
              <a
                href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-button-accent underline"
              >
                {t("View on map")}
                <TbExternalLink aria-hidden />
              </a>
            </span>
          )}
        </div>
      ),
    },
    {
      label: t("Submitted by"),
      value: report.user ? (
        <span className="flex items-center gap-2">
          <span className="relative size-7 shrink-0 overflow-hidden rounded-full">
            <AppImage src={report.user.avatar || defaultAvatar} alt="" fill sizes="28px" className="object-cover" />
          </span>
          {report.user.name}
        </span>
      ) : (
        dash
      ),
    },
    { label: t("Submitted at"), value: formattedDate(report.created_at, true) || "—" },
    { label: t("Report type"), value: category ? t(category) : dash },
    { label: t("Waste Type"), value: <WasteTypeCell value={report.waste_type} isDark={isDark} /> },
    { label: t("Severity"), value: <SeverityCell value={report.severity_level} isDark={isDark} /> },
    { label: t("Condition"), value: <ConditionCell value={report.condition} isDark={isDark} /> },
    { label: t("Reject Reason"), value: report.reject_reason || dash },
    { label: t("Handled by"), value: report.handled_by?.name || dash },
  ];

  return (
    <section
      aria-label={t("Information")}
      className={cn("flex flex-col gap-5 rounded-[10px] border p-5", isDark ? "border-zinc-700 bg-zinc-900" : "border-border bg-card")}
    >
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AntdImage.PreviewGroup>
            {images.map((url, i) => (
              <AntdImage
                key={url + i}
                src={url}
                alt={t("Report photo {{n}}", { n: i + 1 })}
                className="aspect-square w-full rounded-md object-cover"
              />
            ))}
          </AntdImage.PreviewGroup>
        </div>
      ) : (
        <p className={cn("text-sm", muted)}>{t("No photos")}</p>
      )}

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className={muted}>{row.label}</dt>
            <dd className={cn("min-w-0 break-words", strong)}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className={cn("flex flex-col gap-2 border-t pt-4", isDark ? "border-zinc-700" : "border-border")}>
        <h3 className={cn("font-display-3 font-semibold", strong)}>{t("AI recommendation")}</h3>
        {report.ai_recommendation ? (
          <div className={cn("prose prose-sm max-w-none", isDark && "prose-invert")}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {report.ai_recommendation}
            </ReactMarkdown>
          </div>
        ) : (
          <p className={cn("text-sm", muted)}>—</p>
        )}
      </div>
    </section>
  );
}
