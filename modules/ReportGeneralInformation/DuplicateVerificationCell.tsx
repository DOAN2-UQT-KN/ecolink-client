import { memo, useCallback, useState, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "antd";

import type { IDuplicateVerification } from "@/apis/incident/models/incident";
import { cn } from "@/libs/utils";
import { DuplicateReportModal } from "./DuplicateReportModal";

export type DuplicateVerificationCellProps = {
  value: IDuplicateVerification[] | null | undefined;
  /** Open linked duplicate report in a new tab (admin tables). */
  openInNewTab?: boolean;
  isDark?: boolean;
  className?: string;
};

export const DuplicateVerificationCell = memo(function DuplicateVerificationCell({
  value,
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

  const groups = value;
  if (groups.length === 0) {
    return (
      <Tag color="green" className={cn("!m-0", className)}>
        {t("No duplicate")}
      </Tag>
    );
  }

  const reportIds = groups.map((group) => group.duplicate_report_id);

  return (
    <div className={cn("flex flex-col gap-1 min-w-0", className)}>
      <Tag color="red" className="!m-0 w-fit">
        {t("Duplicate")}
      </Tag>
      <button
        type="button"
        onClick={openModal}
        onPointerDown={stop}
        className="text-left text-[11px] font-medium text-primary underline-offset-2 hover:underline truncate"
        title={reportIds.join(", ")}
      >
        {groups.length > 1
          ? t("View {{count}} duplicate reports", { count: groups.length })
          : t("View duplicate report")}
      </button>
      <DuplicateReportModal
        open={open}
        onOpenChange={setOpen}
        verification={value}
        openInNewTab={openInNewTab}
        isDark={isDark}
      />
    </div>
  );
});

export default DuplicateVerificationCell;
