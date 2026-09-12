import { memo, useCallback, useState, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "antd";

import type {
  IDuplicateVerification,
  IMediaFiles,
} from "@/apis/incident/models/incident";
import { cn } from "@/libs/utils";
import { DuplicateReportModal } from "./DuplicateReportModal";
import { duplicateReasonLabel } from "./duplicateReasonLabel";

export type DuplicateVerificationCellProps = {
  value: IDuplicateVerification | null | undefined;
  /** Current report media — used to resolve match media_id → URL in the modal. */
  mediaFiles?: IMediaFiles[];
  /** Open linked duplicate report in a new tab (admin tables). */
  openInNewTab?: boolean;
  isDark?: boolean;
  className?: string;
};

export const DuplicateVerificationCell = memo(function DuplicateVerificationCell({
  value,
  mediaFiles,
  openInNewTab = false,
  isDark = false,
  className,
}: DuplicateVerificationCellProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const stop = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const openModal = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      setOpen(true);
    },
    [],
  );

  if (value == null) {
    return (
      <Tag className={cn("!m-0", className)}>
        {t("Duplicate check pending")}
      </Tag>
    );
  }

  const duplicateId = value.duplicate_report_id;
  if (!duplicateId) {
    return (
      <Tag color="green" className={cn("!m-0", className)}>
        {t("No duplicate")}
      </Tag>
    );
  }

  const primaryReason = value.reasons[0]
    ? duplicateReasonLabel(value.reasons[0], t)
    : t("Duplicate");
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";

  return (
    <div className={cn("flex flex-col gap-1 min-w-0", className)}>
      <Tag color="red" className="!m-0 w-fit">
        {t("Duplicate")}
      </Tag>
      <span className={cn("text-[11px] leading-tight", muted)}>{primaryReason}</span>
      <button
        type="button"
        onClick={openModal}
        onPointerDown={stop}
        className="text-left text-[11px] font-medium text-primary underline-offset-2 hover:underline truncate"
        title={duplicateId}
      >
        {t("View duplicate report")}
      </button>
      <DuplicateReportModal
        open={open}
        onOpenChange={setOpen}
        verification={value}
        mediaFiles={mediaFiles}
        openInNewTab={openInNewTab}
        isDark={isDark}
      />
    </div>
  );
});

export default DuplicateVerificationCell;
