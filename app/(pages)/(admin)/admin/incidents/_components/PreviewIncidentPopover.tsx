"use client";

import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { IIncident } from "@/apis/incident/models/incident";
import ReportDetailCard from "@/modules/ReportDetailCard/ReportDetailCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/libs/utils";

export type PreviewIncidentPopoverProps = {
  incident: IIncident;
  /** Matches admin layout for dialog chrome only; card body follows ReportDetailCard styling. */
  theme?: "light" | "dark";
  trigger: ReactNode;
};

export const PreviewIncidentPopover = memo(function PreviewIncidentPopover({
  incident,
  theme = "dark",
  trigger,
}: PreviewIncidentPopoverProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "max-h-[min(90vh,900px)] w-full max-w-[min(100vw-2rem,1024px)] gap-0 overflow-hidden border-none p-0",
          isDark ? "bg-zinc-900" : "bg-white/95 backdrop-blur-md",
        )}
        showCloseButton
      >
        <DialogHeader
          className={cn(
            "border-b px-4 py-3 sm:px-6",
            isDark ? "border-zinc-700" : "border-zinc-200",
          )}
        >
          <DialogTitle
            className={cn(
              "text-left text-base font-semibold",
              isDark ? "text-zinc-100" : "text-zinc-900",
            )}
          >
            {t("Preview")}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-4 pb-6 sm:px-6">
          <ReportDetailCard incident={incident} isExpanded showAction={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default PreviewIncidentPopover;
