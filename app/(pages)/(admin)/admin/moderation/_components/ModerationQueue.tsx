import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from "@/components/admin/shared/DataTable";
import AppImage from "@/components/ui/AppImage";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IModerationQueueItem, ModerationFlag } from "@/apis/incident/models/moderation";
import { reasonCopy, shortReportCode } from "@/constants/reportVerification";
import { cn } from "@/libs/utils";
import { useModerationContext } from "../_context/ModerationContext";

const COLUMN_KEYS = { REPORT: "report", SCORE: "score", REASONS: "reasons" } as const;

export function ModerationQueue() {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";
  const {
    flag,
    page,
    pageSize,
    total,
    reports,
    counts,
    loading,
    error,
    refetch,
    selectedId,
    onFlagChange,
    onPageChange,
    onPageSizeChange,
    onSelect,
  } = useModerationContext();

  const columns: DataTableColumn<IModerationQueueItem>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.REPORT,
        title: t("Report"),
        render: (_v, record) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
              {record.thumbnail_url && (
                <AppImage src={record.thumbnail_url} alt="" fill sizes="48px" className="object-cover" />
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <span
                className={cn(
                  "truncate text-sm font-medium",
                  isDark ? "text-zinc-100" : "text-foreground",
                  record.id === selectedId && "font-semibold text-button-accent",
                )}
              >
                {record.title || t("Untitled report")}
              </span>
              <span className={cn("text-xs", isDark ? "text-zinc-400" : "text-muted-foreground")}>
                {shortReportCode(record.id)}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.SCORE,
        title: t("Score"),
        width: 80,
        render: (_v, record) => (
          <span className="font-mono text-sm">{record.risk_score != null ? record.risk_score.toFixed(2) : "—"}</span>
        ),
      },
      {
        key: COLUMN_KEYS.REASONS,
        title: t("Reasons"),
        render: (_v, record) => (
          <span className={cn("text-xs", isDark ? "text-zinc-300" : "text-foreground-secondary")}>
            {record.reasons.map((code) => t(reasonCopy(code).short ?? reasonCopy(code).title)).join(" · ") || "—"}
          </span>
        ),
      },
    ],
    [isDark, selectedId, t],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Tabs value={flag} onValueChange={(v) => onFlagChange(v as ModerationFlag)}>
        <TabsList>
          <TabsTrigger value="REVIEW" className="gap-2">
            {t("To review")}
            <Badge variant="secondary">{counts.review}</Badge>
          </TabsTrigger>
          <TabsTrigger value="REJECT" className="gap-2">
            {t("Auto-rejected")}
            <Badge variant="secondary">{counts.auto_rejected}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <SharedDataTable<IModerationQueueItem>
        columns={columns}
        data={reports}
        loading={loading}
        error={error ? t("Could not load the moderation queue") : null}
        onRetry={refetch}
        rowKey="id"
        theme={isDark ? "dark" : "light"}
        emptyTitle={flag === "REVIEW" ? t("No reports to review") : t("No auto-rejected reports")}
        onRowClick={(record) => onSelect(record.id)}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange,
          onPageSizeChange,
        }}
      />
    </div>
  );
}
