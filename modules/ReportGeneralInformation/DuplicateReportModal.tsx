"use client";

import { memo, useCallback, useMemo, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image as AntdImage, Spin } from "antd";
import { Loader2 } from "lucide-react";

import type {
  IDuplicateVerification,
  IMediaFiles,
} from "@/apis/incident/models/incident";
import { useGetReportDetail } from "@/apis/incident/getReportDetail";
import { Link } from "@/libs/router";
import { cn } from "@/libs/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { duplicateReasonLabel } from "./duplicateReasonLabel";

export type DuplicateReportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verification: IDuplicateVerification;
  mediaFiles?: IMediaFiles[];
  openInNewTab?: boolean;
  isDark?: boolean;
};

function findMediaUrl(
  files: IMediaFiles[] | undefined,
  mediaId: string,
): string | undefined {
  return files?.find((f) => f.media_id === mediaId)?.url;
}

function MediaThumb({
  url,
  label,
  isDark,
  loading,
}: {
  url?: string;
  label: string;
  isDark: boolean;
  loading?: boolean;
}) {
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";
  const box = isDark
    ? "border-zinc-700 bg-zinc-800"
    : "border-border/50 bg-muted";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className={cn("text-[11px] font-medium", muted)}>{label}</span>
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-lg border",
          box,
        )}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2
              className={cn(
                "h-5 w-5 animate-spin",
                isDark ? "text-zinc-400" : "text-muted-foreground",
              )}
            />
          </div>
        ) : url ? (
          <AntdImage
            src={url}
            alt={label}
            className="!h-full !w-full object-cover"
            wrapperClassName="!h-full !w-full"
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
    </div>
  );
}

export const DuplicateReportModal = memo(function DuplicateReportModal({
  open,
  onOpenChange,
  verification,
  mediaFiles,
  openInNewTab = false,
  isDark = false,
}: DuplicateReportModalProps) {
  const { t } = useTranslation();
  const duplicateId = verification.duplicate_report_id;

  const { data, isLoading, isFetching } = useGetReportDetail(duplicateId ?? "", {
    enabled: open && Boolean(duplicateId),
  });

  const duplicateMediaFiles = data?.data?.report?.media_files;
  const duplicateLoading = Boolean(duplicateId) && (isLoading || isFetching);

  const reasonMessages = useMemo(
    () =>
      verification.reasons.length > 0
        ? verification.reasons.map((r) => duplicateReasonLabel(r, t))
        : [t("Duplicate")],
    [t, verification.reasons],
  );

  const stop = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const imageShield = {
    onClick: stop,
    onPointerDown: stop,
    onMouseDown: stop,
  } as const;

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
          <Alert
            type="error"
            showIcon
            message={
              reasonMessages.length === 1
                ? reasonMessages[0]
                : reasonMessages.join(" · ")
            }
          />

          {verification.matches.length === 0 ? (
            <p
              className={cn(
                "text-sm",
                isDark ? "text-zinc-400" : "text-muted-foreground",
              )}
            >
              {t("No media matches")}
            </p>
          ) : (
            <Spin spinning={duplicateLoading}>
              <div className="flex flex-col gap-4" {...imageShield}>
                <AntdImage.PreviewGroup preview={{ zIndex: 2000 }}>
                  {verification.matches.map((match) => {
                    const currentUrl = findMediaUrl(mediaFiles, match.media_id);
                    const duplicateUrl = findMediaUrl(
                      duplicateMediaFiles,
                      match.duplicate_media_id,
                    );
                    return (
                      <div
                        key={`${match.media_id}-${match.duplicate_media_id}`}
                        className="flex gap-3"
                      >
                        <MediaThumb
                          url={currentUrl}
                          label={t("This report")}
                          isDark={isDark}
                        />
                        <MediaThumb
                          url={duplicateUrl}
                          label={t("Duplicate report")}
                          isDark={isDark}
                          loading={duplicateLoading && !duplicateUrl}
                        />
                      </div>
                    );
                  })}
                </AntdImage.PreviewGroup>
              </div>
            </Spin>
          )}

          {duplicateId ? (
            <Link
              href={`/incidents/${duplicateId}`}
              target={openInNewTab ? "_blank" : undefined}
              rel={openInNewTab ? "noopener noreferrer" : undefined}
              onClick={stop}
              onPointerDown={stop}
              className="inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              {t("View duplicate report")}
            </Link>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default DuplicateReportModal;
