'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TbExternalLink } from 'react-icons/tb';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { StatusTag } from '@/components/ui/StatusTag';
import { RichTextContent } from '@/components/ui/RichTextContent';
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from '@/components/admin/shared/DataTable';
import { cn } from '@/libs/utils';
import { useCampaignContext } from '../_context/CampaignContext';
import { VerifyCampaignConfirm } from './VerifyCampaignConfirm';

const COLUMN_KEYS = {
  NO: 'no',
  TITLE: 'title',
  DESCRIPTION: 'description',
  CREATED_AT: 'created_at',
  DATE_RANGE: 'date_range',
  ORGANIZATION: 'organization',
  STATUS: 'status',
  MEMBERS: 'members',
  GREEN_POINTS: 'green_points',
  DIFFICULTY: 'difficulty',
  ACTION: 'action',
} as const;

function toDisplayDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

function difficultyLabel(difficulty?: number | null): string {
  if (difficulty == null) return '—';
  if (difficulty <= 1) return 'Easy';
  if (difficulty === 2) return 'Medium';
  if (difficulty === 3) return 'Hard';
  return `Lv ${difficulty}`;
}

function difficultyColor(difficulty?: number | null, isDark = true): string {
  if (difficulty == null) return isDark ? 'text-zinc-500' : 'text-zinc-400';
  if (difficulty <= 1) return 'text-emerald-400';
  if (difficulty === 2) return 'text-amber-400';
  return 'text-rose-400';
}

const OrgCell = memo(function OrgCell({
  org,
  isDark,
}: {
  org?: ICampaign['organization'];
  isDark: boolean;
}) {
  if (!org) {
    return <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>—</span>;
  }

  const fallback = org.name?.slice(0, 2).toUpperCase() || '?';

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden ring-1 text-xs font-semibold',
          isDark
            ? 'ring-zinc-600 bg-zinc-800 text-zinc-300'
            : 'ring-zinc-300 bg-zinc-200 text-zinc-600',
        )}
      >
        {org.logo_url ? (
          <img src={org.logo_url} alt={org.name} className="h-full w-full object-cover" />
        ) : (
          fallback
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className={cn('text-sm font-medium', isDark ? 'text-zinc-100' : 'text-zinc-900')}>
          {org.name}
        </span>
        {org.contact_email && (
          <span className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-zinc-500')}>
            {org.contact_email}
          </span>
        )}
      </div>
    </div>
  );
});

export const DataTable = memo(function DataTable() {
  const { t } = useTranslation();
  const { campaigns, loading, pagination, total, onPageChange, onPageSizeChange } =
    useCampaignContext();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';

  const columns: DataTableColumn<ICampaign>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NO,
        title: t('No'),
        className: 'w-[60px]',
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.TITLE,
        title: t('Title'),
        className: 'min-w-[200px] max-w-[260px]',
        render: (_, record) => (
          <span
            className={cn('font-medium line-clamp-2', isDark ? 'text-zinc-100' : 'text-zinc-900')}
          >
            {record.title}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.DESCRIPTION,
        title: t('Description'),
        className: 'min-w-[220px] max-w-[300px]',
        render: (_, record) => (
          <RichTextContent
            value={record.description}
            className="text-sm text-foreground whitespace-pre-wrap break-words !font-display-1"
            maxLines={2}
            showMoreLabel={t('See more')}
            showLessLabel={t('See less')}
            emptyFallback={<span className="text-foreground-secondary">—</span>}
          />
        ),
      },
      {
        key: COLUMN_KEYS.CREATED_AT,
        title: t('Created at'),
        className: 'min-w-[120px]',
        render: (_, record) => (
          <span className={cn('tabular-nums text-sm', isDark ? 'text-zinc-300' : 'text-zinc-700')}>
            {toDisplayDate(record.created_at)}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.DATE_RANGE,
        title: t('Start — End'),
        className: 'min-w-[180px]',
        render: (_, record) => (
          <div className="space-y-0.5">
            <p className={cn('text-xs', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
              <span className="font-medium">{t('Start')}:</span> {toDisplayDate(record.start_date)}
            </p>
            <p className={cn('text-xs', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
              <span className="font-medium">{t('End')}:</span> {toDisplayDate(record.end_date)}
            </p>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.ORGANIZATION,
        title: t('Organization'),
        className: 'min-w-[180px]',
        render: (_, record) => <OrgCell org={record.organization} isDark={isDark} />,
      },
      {
        key: COLUMN_KEYS.STATUS,
        title: t('Status'),
        className: 'min-w-[120px]',
        render: (_, record) => (
          <StatusTag status={record.status} className="!mx-0 min-w-0 justify-center" />
        ),
      },
      {
        key: COLUMN_KEYS.MEMBERS,
        title: t('Members'),
        className: 'min-w-[110px]',
        render: (_, record) => (
          <span className={cn('tabular-nums text-sm', isDark ? 'text-zinc-300' : 'text-zinc-700')}>
            <span className="font-semibold text-emerald-400">{record.current_members ?? 0}</span>
            <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}> / </span>
            <span>{record.max_members ?? '∞'}</span>
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.GREEN_POINTS,
        title: t('Green pts'),
        className: 'min-w-[100px]',
        render: (_, record) => (
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-500">
            🌿 {record.green_points ?? 0}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.DIFFICULTY,
        title: t('Difficulty'),
        className: 'min-w-[100px]',
        render: (_, record) => (
          <span className={cn('text-sm font-medium', difficultyColor(record.difficulty, isDark))}>
            {t(difficultyLabel(record.difficulty))}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t('Action'),
        className: 'sticky right-0 z-20 min-w-[100px]',
        render: (_, record) => (
          <div className="flex items-center gap-2">
            {/* Preview — opens campaign detail in a new tab */}
            <a
              href={`/campaigns/${record.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors duration-200',
                isDark
                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300'
                  : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700',
              )}
              title={t('Preview campaign')}
            >
              <TbExternalLink className="size-5" />
            </a>

            {/* Verify / Reject */}
            <VerifyCampaignConfirm
              campaignId={record.id}
              campaignTitle={record.title}
              theme={isDark ? 'dark' : 'light'}
            />
          </div>
        ),
      },
    ],
    [isDark, pagination.current, pagination.pageSize, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={campaigns}
      loading={loading}
      rowKey="id"
      emptyTitle={t('No campaigns found')}
      emptyDescription={t('No campaigns available for the current filters.')}
      pagination={{
        page: pagination.current,
        pageSize: pagination.pageSize,
        total,
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
});

export default DataTable;
