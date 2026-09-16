"use client";

import { memo, useCallback, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image as AntdImage } from "antd";

import type { IDuplicateVerification } from "@/apis/incident/models/incident";
import { StatusTag } from "@/components/ui/StatusTag";
import { Link } from "@/libs/router";
import { cn } from "@/libs/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DuplicateReportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verification: IDuplicateVerification[];
  openInNewTab?: boolean;
  isDark?: boolean;
};

function MediaThumb({
  url,
  alt,
  isDark,
}: {
  url?: string | null;
  alt: string;
  isDark: boolean;
}) {
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";
  const box = isDark
    ? "border-zinc-700 bg-zinc-800"
    : "border-border/50 bg-muted";

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-[180px] overflow-hidden rounded-lg border",
        box,
      )}
    >
      {url ? (
        <AntdImage
          src={url}
          alt={alt}
          className="!h-full !w-full object-cover"
          rootClassName="!h-full !w-full"
          preview={{ zIndex: 2000 }}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center text-[11px]",
            muted,
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
  openInNewTab,
  isDark,
}: {
  group: IDuplicateVerification;
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
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";
  const reportId = group.duplicate_report_id;

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium",
              isDark ? "text-zinc-100" : "text-zinc-900",
            )}
          >
            {group.title || t("Untitled Incident")}
          </p>
          <StatusTag status={group.status} />
        </div>
        <p className={cn("text-xs", muted)}>
          {group.detail_address || "—"}
        </p>
      </div>
      <div {...imageShield}>
        <AntdImage.PreviewGroup preview={{ zIndex: 2000 }}>
          <Table className={cn(isDark && "[&_tr]:border-zinc-700")}>
              <TableHeader>
                <TableRow
                  className={cn(
                    "hover:bg-transparent",
                    isDark && "hover:bg-transparent border-zinc-700",
                  )}
                >
                  <TableHead
                    className={cn(
                      "w-1/2",
                      isDark ? "text-zinc-300" : "text-foreground",
                    )}
                  >
                    {t("This report")}
                  </TableHead>
                  <TableHead
                    className={cn(
                      "w-1/2",
                      isDark ? "text-zinc-300" : "text-foreground",
                    )}
                  >
                    {t("Duplicate report")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.matches.map((match) => {
                  return (
                    <TableRow
                      key={`${match.new_media.media_id}-${match.duplicate_media.duplicate_media_id}-${reportId}`}
                      className={cn(
                        "hover:bg-transparent",
                        isDark && "hover:bg-transparent border-zinc-700",
                      )}
                    >
                      <TableCell className="align-top whitespace-normal">
                        <MediaThumb
                          url={match.new_media.url}
                          alt={t("This report")}
                          isDark={isDark}
                        />
                      </TableCell>
                      <TableCell className="align-top whitespace-normal">
                        <MediaThumb
                          url={match.duplicate_media.duplicate_url}
                          alt={t("Duplicate report")}
                          isDark={isDark}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AntdImage.PreviewGroup>
        </div>
      <Link
        href={`/incidents/${reportId}`}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        onClick={stop}
        onPointerDown={stop}
        className="inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
      >
        {t("View duplicate report")}
      </Link>
    </section>
  );
}

export const DuplicateReportModal = memo(function DuplicateReportModal({
  open,
  onOpenChange,
  verification,
  openInNewTab = false,
  isDark = false,
}: DuplicateReportModalProps) {
  const { t } = useTranslation();
  const groups = verification;

  const stop = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90vh,900px)] w-full max-w-[min(100vw-2rem,640px)] flex-col gap-0 overflow-hidden border-none p-0",
          isDark ? "bg-zinc-900" : "bg-white/95 backdrop-blur-md",
        )}
        showCloseButton
        onClick={stop}
        onPointerDown={stop}
      >
        <DialogHeader
          className={cn(
            "shrink-0 border-b px-4 py-3 sm:px-6",
            isDark ? "border-zinc-700" : "border-zinc-200",
          )}
        >
          <DialogTitle
            className={cn(
              "text-left text-base font-semibold",
              isDark ? "text-zinc-100" : "text-zinc-900",
            )}
          >
            {t("Duplicate report")}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <Alert type="error" showIcon message={t("Duplicate")} />

          {groups.length === 0 ? (
            <p
              className={cn(
                "text-sm",
                isDark ? "text-zinc-400" : "text-muted-foreground",
              )}
            >
              {t("No media matches")}
            </p>
          ) : (
            groups.map((group) => (
              <DuplicateReportSection
                key={group.duplicate_report_id}
                group={group}
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
