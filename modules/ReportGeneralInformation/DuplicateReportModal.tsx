"use client";

import {
  memo,
  useCallback,
  useEffect,
  useState,
  type SyntheticEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { Image as AntdImage } from "antd";
import { ChevronDown } from "lucide-react";

import type { IDuplicateVerification } from "@/apis/incident/models/incident";
import { STATUS } from "@/constants/status";
import TagStatus from "@/components/ui/TagStatus";
import { Link } from "@/libs/router";
import { cn } from "@/libs/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type DuplicateReportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verification: IDuplicateVerification[];
  openInNewTab?: boolean;
  isDark?: boolean;
  /** Called before the dialog closes. Omit to treat confirm as dismiss. */
  onConfirm?: () => void;
};

function statusDotClass(status: number | null, isDark: boolean) {
  switch (status) {
    case STATUS.ACTIVE:
    case STATUS.APPROVED:
    case STATUS.CONFIRMED:
    case STATUS.COMPLETED:
      return "bg-green-500";
    case STATUS.INACTIVE:
    case STATUS.DELETED:
    case STATUS.REJECTED:
    case STATUS.FAILED:
    case STATUS.CANCELED:
    case STATUS.CLOSED:
    case STATUS.UPLOAD_FAILED:
      return "bg-red-500";
    case STATUS.DRAFT:
    case STATUS.PENDING:
    case STATUS.TODO:
    case STATUS.TODO_BYPASS:
      return "bg-zinc-400";
    case STATUS.NEW:
    case STATUS.RECEIVED:
      return "bg-cyan-500";
    case STATUS.WAITING_APPROVED:
    case STATUS.WAITING_CONFIRMED:
    case STATUS.INREVIEW:
      return "bg-orange-500";
    case STATUS.VERIFIED:
    case STATUS.IN_PROGRESS:
      return "bg-blue-500";
    case STATUS.OBSOLETE:
      return "bg-lime-500";
    default:
      return isDark ? "bg-zinc-500" : "bg-background-tertiary";
  }
}

function MediaThumb({
  url,
  alt,
  isDark,
}: {
  url?: string | null;
  alt: string;
  isDark: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[16/10] w-full overflow-hidden rounded-xl",
        isDark ? "bg-zinc-900" : "bg-background-primary",
      )}
    >
      {url ? (
        <AntdImage
          src={url}
          alt={alt}
          className="!h-full !w-full object-cover"
          rootClassName="!block !h-full !w-full"
          preview={{ zIndex: 2000 }}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center text-xs",
            isDark ? "text-zinc-500" : "text-foreground-tertiary",
          )}
        >
          —
        </div>
      )}
    </div>
  );
}

function DuplicateReportSection({
  group,
  expanded,
  onToggle,
  openInNewTab,
  isDark,
}: {
  group: IDuplicateVerification;
  expanded: boolean;
  onToggle: () => void;
  openInNewTab: boolean;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const stop = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
  }, []);
  const imageShield = {
    onClick: stop,
    onPointerDown: stop,
    onMouseDown: stop,
  } as const;

  const reportId = group.duplicate_report_id;
  const title = group.title || t("Untitled report");
  const muted = isDark ? "text-zinc-400" : "text-foreground-tertiary";
  const heading = isDark ? "text-zinc-50" : "text-foreground-primary";

  return (
    <section
      className={cn(
        "rounded-2xl border px-4 py-3.5",
        isDark
          ? "border-zinc-700 bg-zinc-800/70"
          : "border-[rgba(136,122,71,0.28)] bg-white",
      )}
    >
      <div
        className="flex cursor-pointer items-start gap-2.5"
        onClick={onToggle}
      >
        <span
          className={cn(
            "mt-1.5 size-2.5 shrink-0 rounded-full",
            statusDotClass(group.status, isDark),
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/incidents/${reportId}`}
              target={openInNewTab ? "_blank" : undefined}
              rel={openInNewTab ? "noopener noreferrer" : undefined}
              onClick={stop}
              onPointerDown={stop}
              className={cn(
                "min-w-0 text-[15px] leading-snug font-semibold hover:text-button-accent",
                heading,
              )}
            >
              {title}
            </Link>
            {group.status != null ? (
              <span onClick={stop} onPointerDown={stop}>
                <TagStatus
                  type={group.status}
                  className="!mx-0 !min-w-0 shrink-0"
                />
              </span>
            ) : null}
          </div>
          <p className={cn("mt-0.5 truncate text-sm", muted)}>
            {group.detail_address || "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            stop(event);
            onToggle();
          }}
          aria-expanded={expanded}
          className={cn(
            "mt-0.5 inline-flex shrink-0 items-center self-center gap-1 rounded-full px-1.5 py-0.5 text-sm font-medium transition-colors",
            muted,
            isDark ? "hover:bg-zinc-700" : "hover:bg-background-primary",
          )}
        >
          <span className="tabular-nums">{group.matches.length}×</span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-4" {...imageShield}>
          <AntdImage.PreviewGroup preview={{ zIndex: 2000 }}>
            {group.matches.map((match) => (
              <div
                key={`${match.new_media.media_id}-${match.duplicate_media.duplicate_media_id}-${reportId}`}
                className="grid grid-cols-2 gap-3"
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      "mb-2 text-[11px] font-medium tracking-[0.14em] uppercase",
                      muted,
                    )}
                  >
                    {t("New media")}
                  </p>
                  <MediaThumb
                    url={match.new_media.url}
                    alt={t("New media")}
                    isDark={isDark}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "mb-2 text-[11px] font-medium tracking-[0.14em] uppercase",
                      muted,
                    )}
                  >
                    {t("Duplicate media")}
                  </p>
                  <MediaThumb
                    url={match.duplicate_media.duplicate_url}
                    alt={t("Duplicate media")}
                    isDark={isDark}
                  />
                </div>
              </div>
            ))}
          </AntdImage.PreviewGroup>
        </div>
      ) : null}
    </section>
  );
}

export const DuplicateReportModal = memo(function DuplicateReportModal({
  open,
  onOpenChange,
  verification,
  openInNewTab = false,
  isDark = false,
  onConfirm,
}: DuplicateReportModalProps) {
  const { t } = useTranslation();
  const groups = verification;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open) return;
    setExpandedIds((current) => {
      const validIds = groups.map((group) => group.duplicate_report_id);
      const next = new Set(
        [...current].filter((id) => validIds.includes(id)),
      );
      if (next.size === 0 && validIds[0]) {
        next.add(validIds[0]);
      }
      return next;
    });
  }, [open, groups]);

  const stop = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm?.();
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  const summary =
    groups.length === 1
      ? t("1 report matched an existing record")
      : t("{{count}} reports matched existing records", {
          count: groups.length,
        });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90vh,900px)] w-full max-w-[min(100vw-2rem,680px)] flex-col gap-0 overflow-hidden rounded-2xl p-0 font-display shadow-neutral-500",
          "[&_[data-slot=dialog-close]]:top-5 [&_[data-slot=dialog-close]]:right-5",
          isDark
            ? "border-zinc-700 bg-zinc-900 text-zinc-100 [&_[data-slot=dialog-close]]:text-zinc-400 [&_[data-slot=dialog-close]]:hover:bg-zinc-800 [&_[data-slot=dialog-close]]:hover:text-zinc-100"
            : "border-[rgba(136,122,71,0.28)] bg-white text-foreground-primary [&_[data-slot=dialog-close]]:text-foreground-tertiary [&_[data-slot=dialog-close]]:hover:bg-background-primary [&_[data-slot=dialog-close]]:hover:text-button-accent",
        )}
        showCloseButton
        onClick={stop}
        onPointerDown={stop}
      >
        <DialogHeader className="shrink-0 gap-1 px-5 pt-5 pr-12 pb-3">
          <DialogTitle
            className={cn(
              "text-left text-lg font-semibold",
              isDark ? "text-zinc-50" : "text-foreground-primary",
            )}
          >
            {t("Duplicate media detected")}
          </DialogTitle>
          <DialogDescription
            className={cn(
              "text-left text-sm",
              isDark ? "text-zinc-400" : "text-foreground-tertiary",
            )}
          >
            {summary}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-4">
          {groups.length === 0 ? (
            <p
              className={cn(
                "text-sm",
                isDark ? "text-zinc-400" : "text-foreground-tertiary",
              )}
            >
              {t("No media matches")}
            </p>
          ) : (
            groups.map((group) => (
              <DuplicateReportSection
                key={group.duplicate_report_id}
                group={group}
                expanded={expandedIds.has(group.duplicate_report_id)}
                onToggle={() =>
                  setExpandedIds((current) => {
                    const next = new Set(current);
                    if (next.has(group.duplicate_report_id)) {
                      next.delete(group.duplicate_report_id);
                    } else {
                      next.add(group.duplicate_report_id);
                    }
                    return next;
                  })
                }
                openInNewTab={openInNewTab}
                isDark={isDark}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default DuplicateReportModal;
