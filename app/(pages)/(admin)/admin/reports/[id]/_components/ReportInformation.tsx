import type { ReactNode } from "react";
import { Image as AntdImage } from "antd";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { TbExternalLink, TbPhotoOff } from "react-icons/tb";
import type { IIncident } from "@/apis/incident/models/incident";
import AppImage from "@/components/ui/AppImage";
import { Pill } from "@/components/ui/Pill";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { StatusTag } from "@/components/ui/StatusTag";
import { reportCategoryLabel, reportVerificationOutcome } from "@/constants/reportVerification";
import { getSeverityLevel } from "@/constants/severity";
import { REPORT_OUTCOME_LABEL, REPORT_OUTCOME_TONE } from "@/constants/statusTone";
import { formattedDate } from "@/utils/formattedDate";
import { CONDITION_LABELS, getWasteTypeLabels } from "@/modules/ReportGeneralInformation";
import { cn } from "@/libs/utils";
import defaultAvatar from "@/public/default-avatar.png";

const imagesOf = (report: IIncident) => report.image_urls || report.media_files?.map((m) => m.url) || [];

type Item = { label: string; value: ReactNode; wide?: boolean };

/**
 * Everything the reporter sent, plus who handles it (specs/008 US2, FR-009): photos on the left,
 * a compact grid of facts on the right, one text size for every value. Empty fields read "—".
 */
export function ReportInformation({ report, isDark }: { report: IIncident; isDark: boolean }) {
  const { t } = useTranslation();
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";
  const strong = isDark ? "text-zinc-100" : "text-foreground";
  const dash = <span className={muted}>—</span>;
  const images = imagesOf(report);
  const hasPoint = report.latitude != null && report.longitude != null;

  const category = reportCategoryLabel(report.category);
  const wasteTypes = getWasteTypeLabels(report.waste_type, t);
  const severity = getSeverityLevel(report.severity_level);
  const outcome = reportVerificationOutcome(report);

  const items: Item[] = [
    { label: t("Report type"), value: category ? t(category) : dash },
    { label: t("Waste Type"), value: wasteTypes.length ? wasteTypes.join(", ") : dash },
    {
      label: t("Severity"),
      value: severity ? <span className={cn("font-medium", severity.textClass)}>{t(severity.label)}</span> : dash,
    },
    {
      label: t("Condition"),
      value: report.condition ? t(CONDITION_LABELS[report.condition] ?? report.condition) : dash,
    },
    {
      label: t("Status"),
      value:
        outcome && (report.latest_verification || outcome !== "rejected") ? (
          <Pill tone={REPORT_OUTCOME_TONE[outcome]} isDark={isDark}>
            {t(REPORT_OUTCOME_LABEL[outcome])}
          </Pill>
        ) : (
          <StatusTag status={report.status} isDark={isDark} />
        ),
    },
    { label: t("Handled by"), value: report.handled_by?.name || dash },
    {
      label: t("Submitted by"),
      value: report.user ? (
        <span className="flex min-w-0 items-center gap-2">
          <span className="relative size-6 shrink-0 overflow-hidden rounded-full">
            <AppImage src={report.user.avatar || defaultAvatar} alt="" fill sizes="24px" className="object-cover" />
          </span>
          <span className="truncate">{report.user.name}</span>
        </span>
      ) : (
        dash
      ),
    },
    { label: t("Submitted at"), value: formattedDate(report.created_at, true) || dash },
    {
      label: t("Address"),
      wide: true,
      value: (
        <span className="flex flex-col gap-0.5">
          <span>{report.detail_address || "—"}</span>
          {hasPoint && (
            <span className={cn("flex flex-wrap items-center gap-2", muted)}>
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
        </span>
      ),
    },
    {
      label: t("Description"),
      wide: true,
      value: report.description ? <RichTextContent value={report.description} className="text-sm" /> : dash,
    },
    ...(report.reject_reason ? [{ label: t("Reject Reason"), wide: true, value: report.reject_reason }] : []),
  ];

  return (
    <section
      aria-label={t("Information")}
      className={cn("flex flex-col gap-6 rounded-[10px] border p-5", isDark ? "border-zinc-700 bg-zinc-900" : "border-border bg-card")}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Photos are equally important: one tile, "+N" for the rest, all in one preview. */}
        <div className="flex flex-col gap-2">
          {images.length > 0 ? (
            <AntdImage.PreviewGroup items={images}>
              <div className="relative">
                <AntdImage
                  src={images[0]}
                  alt={
                    images.length > 1
                      ? t("{{count}} photos, open to view all", { count: images.length })
                      : t("Report photo {{n}}", { n: 1 })
                  }
                  rootClassName="block w-full"
                  className="aspect-[4/3] w-full rounded-md object-cover"
                />
                {images.length > 1 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-black/50 text-2xl font-semibold text-white"
                  >
                    +{images.length - 1}
                  </span>
                )}
              </div>
            </AntdImage.PreviewGroup>
          ) : (
            <div
              className={cn(
                "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-md text-sm",
                isDark ? "bg-zinc-800 text-zinc-400" : "bg-muted text-muted-foreground",
              )}
            >
              <TbPhotoOff className="size-6" aria-hidden />
              {t("No photos")}
            </div>
          )}
        </div>

        <dl className="grid content-start gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className={cn("flex min-w-0 flex-col gap-1", item.wide && "sm:col-span-2 xl:col-span-3")}>
              <dt className={cn("text-xs font-medium uppercase tracking-wide", muted)}>{item.label}</dt>
              <dd className={cn("min-w-0 break-words text-sm", strong)}>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

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
