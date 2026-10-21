import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetPointRuleHistory } from "@/apis/gamification/getPointRuleHistory";
import type { IPointRuleHistoryItem } from "@/apis/gamification/models/pointRules";
import { DataTable as SharedDataTable, type DataTableColumn } from "@/components/admin/shared/DataTable";
import { formattedDate } from "@/utils/formattedDate";
import { describeChanges } from "../_services/pointRulesForm.service";

const PAGE_SIZE = 10;

const FIELD_LABEL = {
  campaignCompletionPoints: "Campaign points",
  baseReportPoint: "Report base points",
  reportMilestoneThresholds: "Upvote milestones",
  reportCompletionPoints: "Report completion points",
} as const;

export function PointRuleHistoryTable() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const request = useMemo(() => ({ page, limit: PAGE_SIZE }), [page]);
  const { data, isLoading, isError, refetch } = useGetPointRuleHistory(request);
  const items = data?.data?.items ?? [];
  const total = data?.data?.meta?.total ?? 0;

  const columns: DataTableColumn<IPointRuleHistoryItem>[] = useMemo(
    () => [
      {
        key: "changedAt",
        title: t("Time"),
        width: 180,
        render: (_v, r) => <span className="text-sm">{formattedDate(r.changedAt, true)}</span>,
      },
      {
        key: "changedBy",
        title: t("Changed by"),
        width: 200,
        render: (_v, r) => <span className="text-sm">{r.changedByName || r.changedBy.slice(0, 8)}</span>,
      },
      {
        key: "changes",
        title: t("Changes"),
        render: (_v, r) => {
          const changes = describeChanges(r.before, r.after);
          if (changes.length === 0) return <span className="text-sm">{t("No change")}</span>;
          return (
            <ul className="space-y-1 text-sm">
              {changes.map((c) => (
                <li key={c.field}>
                  {t(FIELD_LABEL[c.field])}: {c.from === null ? c.to : `${c.from} → ${c.to}`}
                </li>
              ))}
            </ul>
          );
        },
      },
    ],
    [t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={items}
      loading={isLoading}
      error={isError ? t("Could not load the change history.") : undefined}
      onRetry={() => refetch()}
      rowKey="id"
      emptyTitle={t("No changes yet")}
      emptyDescription={t("Every save of the point rules appears here.")}
      pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
    />
  );
}
