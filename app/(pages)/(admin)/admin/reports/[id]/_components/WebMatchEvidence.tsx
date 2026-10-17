import { useState } from "react";
import { Image as AntdImage } from "antd";
import { useTranslation } from "react-i18next";
import { TbExternalLink } from "react-icons/tb";
import type { IIncident } from "@/apis/incident/models/incident";
import { cn } from "@/libs/utils";
import type { WebCandidate, WebMatch } from "../_services/evidence.service";

const imagesOf = (report: IIncident) => report.image_urls || report.media_files?.map((m) => m.url) || [];

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

/** Opens a third-party page without telling it where the click came from. */
export function ExternalLink({ href, children, isDark }: { href: string; children: string; isDark: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      className={cn(
        "inline-flex min-w-0 items-center gap-1 text-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2",
        isDark ? "text-zinc-100 focus-visible:ring-zinc-400" : "text-foreground focus-visible:ring-ring",
      )}
    >
      <span className="truncate">{children}</span>
      <TbExternalLink aria-hidden className="size-4 shrink-0" />
    </a>
  );
}

/** The report photo next to the web image it matched (specs/011 US5); numbers are in the card rows. */
export function WebMatchEvidence({ report, match, isDark }: { report: IIncident; match: WebMatch; isDark: boolean }) {
  const { t } = useTranslation();
  const [webFailed, setWebFailed] = useState(false);
  const ours = imagesOf(report)[match.imageIndex ?? 0];
  const host = hostOf(match.pageUrl ?? match.sourceUrl);
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";
  const placeholder = cn(
    "flex aspect-square w-full items-center justify-center rounded-md p-2 text-center text-xs",
    isDark ? "bg-zinc-700 text-zinc-300" : "bg-muted text-muted-foreground",
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <AntdImage.PreviewGroup>
          <figure className="flex min-w-0 flex-col gap-1.5">
            {ours ? (
              <AntdImage src={ours} alt={t("This report")} className="aspect-square w-full rounded-md object-cover" />
            ) : (
              <div className={placeholder} />
            )}
            <figcaption className={cn("truncate text-xs", muted)}>{t("Report under review")}</figcaption>
          </figure>
          <figure className="flex min-w-0 flex-col gap-1.5">
            {webFailed ? (
              <div className={placeholder}>{t("Could not load image")}</div>
            ) : (
              // shortcut: the zoomed preview may load the image without no-referrer; proxy it if hosts must not see the admin URL.
              <AntdImage
                src={match.sourceUrl}
                alt={t("Image found on the web")}
                referrerPolicy="no-referrer"
                onError={() => setWebFailed(true)}
                className="aspect-square w-full rounded-md object-cover"
              />
            )}
            <figcaption className={cn("truncate text-xs", muted)}>{match.pageTitle || host}</figcaption>
          </figure>
        </AntdImage.PreviewGroup>
      </div>
      {match.pageUrl && (
        <a
          href={match.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
            isDark
              ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus-visible:ring-zinc-400"
              : "bg-muted text-foreground hover:bg-accent focus-visible:ring-ring",
          )}
        >
          <span className="flex min-w-0 items-baseline gap-2">
            {t("Open source page")}
            <span className={cn("truncate text-xs font-normal", muted)}>{host}</span>
          </span>
          <TbExternalLink aria-hidden className="size-4 shrink-0" />
        </a>
      )}
    </div>
  );
}

/** Web candidates the signal could not download (FAILED), left for the moderator to open. */
export function WebCandidateList({ candidates, isDark }: { candidates: WebCandidate[]; isDark: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1.5">
      <p className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-zinc-400" : "text-muted-foreground")}>
        {t("Web candidates to check")}
      </p>
      <ul className="flex flex-col gap-1">
        {candidates.map((c) => (
          <li key={c.imageUrl} className="flex min-w-0 items-center gap-2">
            <ExternalLink href={c.pageUrl ?? c.imageUrl} isDark={isDark}>
              {c.pageTitle || hostOf(c.pageUrl ?? c.imageUrl)}
            </ExternalLink>
            {c.matchType && (
              <span className={cn("shrink-0 text-xs", isDark ? "text-zinc-400" : "text-muted-foreground")}>
                {c.matchType === "FULL" ? t("Full match") : t("Partial match")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
