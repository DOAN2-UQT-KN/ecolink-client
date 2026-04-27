"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import { TbPen } from "react-icons/tb";

import type { ICampaign } from "@/apis/campaign/models/campaign";
import { StatusTag } from "@/components/ui/StatusTag";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { formattedDate } from "@/utils/formattedDate";
import { STATUS } from "@/constants/status";
import { cn } from "@/libs/utils";
import { Button } from "@/components/client/shared/Button";
import { DataTable as SharedDataTable, type ColumnType } from "@/components/client/shared/DataTable";
import useCampaignMeContext from "../_hooks/useCampaignMeContext";
import FormFilter from "./FormFilter";
import { UpdateCampaignPopover } from "./UpdateCampaignPopover";

const defaultPagination = { current: 1, pageSize: 10 };

const COLUMN_KEYS = {
  NO: "no",
  TITLE: "title",
  DESCRIPTION: "description",
  CREATED_AT: "created_at",
  DATE_RANGE: "date_range",
  ORGANIZATION: "organization",
  STATUS: "status",
  MEMBERS: "members",
  GREEN_POINTS: "green_points",
  DIFFICULTY: "difficulty",
  ACTION: "action",
} as const;

function difficultyLabel(difficulty?: number | null): string {
  if (difficulty == null) return "—";
  if (difficulty <= 1) return "Easy";
  if (difficulty === 2) return "Medium";
  if (difficulty === 3) return "Hard";
  return `Lv ${difficulty}`;
}

function difficultyColor(difficulty?: number | null): string {
  if (difficulty == null) return "text-zinc-500";
  if (difficulty <= 1) return "text-emerald-500";
  if (difficulty === 2) return "text-amber-500";
  return "text-rose-500";
}

export const DataTable = memo(function DataTable() {
  const { t } = useTranslation();
  const { campaigns, isLoading, pagination, setPagination, total, refetch } = useCampaignMeContext();
  const [selectedCampaign, setSelectedCampaign] = useState<ICampaign | null>(null);
  const [openUpdate, setOpenUpdate] = useState(false);

  const openEdit = useCallback((campaign: ICampaign) => {
    setSelectedCampaign(campaign);
    setOpenUpdate(true);
  }, []);

  const closeEdit = useCallback((open: boolean) => {
    setOpenUpdate(open);
    if (!open) setSelectedCampaign(null);
  }, []);

  const columns: ColumnType<ICampaign>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NO,
        title: t("No"),
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
        width: 60,
      },
      {
        key: COLUMN_KEYS.TITLE,
        title: t("Title"),
        render: (_, record) => <span className="font-medium line-clamp-2">{record.title}</span>,
        width: 220,
      },
      {
        key: COLUMN_KEYS.DESCRIPTION,
        title: t("Description"),
        render: (_, record) => (
          <RichTextContent
            value={record.description}
            className="text-sm text-foreground whitespace-pre-wrap break-words !font-display-1"
            maxLines={2}
            showMoreLabel={t("See more")}
            showLessLabel={t("See less")}
            emptyFallback={<span className="text-foreground-secondary">—</span>}
          />
        ),
        width: 260,
      },
      {
        key: COLUMN_KEYS.CREATED_AT,
        title: t("Created at"),
        render: (_, record) => <span className="tabular-nums">{formattedDate(record.created_at)}</span>,
        width: 140,
      },
      {
        key: COLUMN_KEYS.DATE_RANGE,
        title: t("Start — End"),
        render: (_, record) => (
          <div className="space-y-0.5">
            <p className="text-xs text-zinc-600">
              <span className="font-medium">{t("Start")}:</span>{" "}
              {formattedDate(record.start_date ?? undefined)}
            </p>
            <p className="text-xs text-zinc-600">
              <span className="font-medium">{t("End")}:</span>{" "}
              {formattedDate(record.end_date ?? undefined)}
            </p>
          </div>
        ),
        width: 180,
      },
      {
        key: COLUMN_KEYS.ORGANIZATION,
        title: t("Organization"),
        render: (_, record) => (
          <div className="flex items-center gap-2 min-w-[160px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden ring-1 text-xs font-semibold ring-zinc-300 bg-zinc-200 text-zinc-600">
              {record.organization?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={record.organization.logo_url} alt={record.organization.name} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-zinc-900">{record.organization?.name || "—"}</span>
              <span className="text-xs text-zinc-500">{record.organization?.contact_email || "—"}</span>
            </div>
          </div>
        ),
        width: 220,
      },
      {
        key: COLUMN_KEYS.STATUS,
        title: t("Status"),
        render: (_, record) => <StatusTag status={record.status} className="!mx-0 min-w-0 justify-center" />,
        width: 120,
      },
      {
        key: COLUMN_KEYS.MEMBERS,
        title: t("Members"),
        render: (_, record) => (
          <span className="tabular-nums font-display-1">
            <span className="font-semibold text-emerald-500">{record.current_members ?? 0}</span>
            <span className="text-zinc-400"> / </span>
            <span>{record.max_members ?? "∞"}</span>
          </span>
        ),
        width: 120,
      },
      {
        key: COLUMN_KEYS.GREEN_POINTS,
        title: t("Green pts"),
        render: (_, record) => <span className="flex items-center gap-1 text-sm font-medium text-emerald-500">🌿 {record.green_points ?? 0}</span>,
        width: 120,
      },
      {
        key: COLUMN_KEYS.DIFFICULTY,
        title: t("Difficulty"),
        render: (_, record) => (
          <span className={cn("font-display-1 font-medium", difficultyColor(record.difficulty))}>
            {t(difficultyLabel(record.difficulty))}
          </span>
        ),
        width: 110,
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t("Action"),
        render: (_, record) => {
          const canEdit = [STATUS.ACTIVE, STATUS.PENDING].includes(record.status ?? -1);
          if (!canEdit) return <span className="text-zinc-400">—</span>;
          return (
            <Button
              type="button"
              variant="outlined-brown"
              size="small"
              className="h-8 w-8 p-0 border-none bg-transparent hover:bg-muted shadow-none group"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(record);
              }}
            >
              <TbPen className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
            </Button>
          );
        },
        width: 90,
      },
    ],
    [openEdit, pagination.current, pagination.pageSize, t],
  );

  const handleTableChange = useCallback(
    (page: { current: number; pageSize: number }) => {
      setPagination(page);
    },
    [setPagination],
  );

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <UpdateCampaignPopover
        campaign={selectedCampaign}
        open={openUpdate}
        onOpenChange={closeEdit}
        onUpdated={refetch}
      />
      <SharedDataTable
        rowKey="id"
        columns={columns}
        dataSource={campaigns}
        loading={isLoading}
        pagination={{ ...(pagination ?? defaultPagination), total }}
        onChange={handleTableChange}
        emptyText={t("No campaigns found")}
        filter={<FormFilter />}
      />
    </div>
  );
});

export default DataTable;
