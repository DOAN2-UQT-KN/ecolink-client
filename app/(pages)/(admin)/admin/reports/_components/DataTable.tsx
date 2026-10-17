import { useCallback, useMemo } from 'react';
import Image from '@/components/ui/AppImage';
import { Image as AntdImage } from 'antd';
import { useTranslation } from 'react-i18next';

import type { IIncident } from '@/apis/incident/models/incident';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import AddressDisplay from '@/app/(pages)/(main)/incidents/me/_components/AddressDisplay';
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from '@/components/admin/shared/DataTable';
import { StatusTag } from '@/components/ui/StatusTag';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { cn } from '@/libs/utils';
import { moderationOf, useIncidentContext } from '../_context/IncidentContext';
import { TbFileDescription } from 'react-icons/tb';
import { User } from 'lucide-react';
import { formattedDate } from '@/utils/formattedDate';
import defaultAvatar from '@/public/default-avatar.png';
import { STATUS } from '@/constants/status';
import { reportCategoryLabel, reportOutcomeOf } from '@/constants/reportVerification';
import { REPORT_OUTCOME_LABEL, REPORT_OUTCOME_TONE } from '@/constants/statusTone';
import { Pill } from '@/components/ui/Pill';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@/libs/router';
import {
  ConditionCell,
  SeverityCell,
  WasteTypeCell,
} from '@/modules/ReportGeneralInformation';

const COLUMN_KEYS = {
  NO: 'no',
  INCIDENT: 'incident',
  SEVERITY: 'severity_level',
  CONDITION: 'condition',
  CATEGORY: 'category',
  WASTE_TYPE: 'waste_type',
  OWNER: 'owner',
  AI_ANALYSIS: 'ai_analysis',
  STATUS: 'status',
  RISK: 'risk',
  REJECT_REASON: 'reject_reason',
  HANDLED_BY: 'handledBy',
  ACTION: 'action',
} as const;

function toUserLabel(userId?: string | null) {
  if (!userId) return '-';
  return userId.length > 12 ? `${userId.slice(0, 6)}...${userId.slice(-4)}` : userId;
}

export function DataTable() {
  const { t } = useTranslation();
  const { incidents, loading, pagination, total, filters, onPageChange, onPageSizeChange } =
    useIncidentContext();
  const moderation = moderationOf(filters.status);
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';

  const handleRowClick = useCallback((record: IIncident) => {
    if (!record.id || record.status === STATUS.INACTIVE) return;
    window.open(`/incidents/${record.id}`, '_blank', 'noopener,noreferrer');
  }, []);

  const columns: DataTableColumn<IIncident>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NO,
        title: t('No'),
        className: 'w-[72px]',
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.INCIDENT,
        title: t('Incident'),
        className: 'w-[300px] min-w-[300px] max-w-[300px]',
        sticky: 'left',
        render: (_, record) => (
          // Fixed box: the table lays out automatically, so only this keeps a long address from widening the column.
          <div className="flex w-[276px] items-center gap-3 py-1">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted">
              {record.media_files?.[0]?.url ? (
                <Image
                  src={record.media_files[0].url}
                  alt={record.title || t('Untitled Incident')}
                  fill
                  className="object-cover"
                  sizes="48px"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className={cn(
                  'truncate text-sm font-bold',
                  isDark ? 'text-zinc-100' : 'text-zinc-900',
                )}
              >
                {record.title || t('Untitled Incident')}
              </span>
              <div className="mb-0.5 min-w-0 w-full">
                <RichTextContent
                  value={record.description}
                  className={cn('text-xs', isDark ? 'text-zinc-400' : 'text-muted-foreground')}
                  maxLines={1}
                  showMoreLabel={t('Show more')}
                  showLessLabel={t('Show less')}
                  emptyFallback={
                    <span
                      className={cn(
                        'text-xs',
                        isDark ? 'text-zinc-500' : 'text-muted-foreground/70',
                      )}
                    >
                      —
                    </span>
                  }
                />
              </div>
              <div className="mt-0.5 flex items-center gap-1 overflow-hidden">
                <div className="min-w-0 flex-1">
                  <AddressDisplay
                    latitude={record.latitude}
                    longitude={record.longitude}
                    address={record.detail_address}
                  />
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.SEVERITY,
        title: t('Severity'),
        className: 'min-w-[120px]',
        render: (_, record) => (
          <SeverityCell value={record.severity_level} isDark={isDark} />
        ),
      },
      {
        key: COLUMN_KEYS.CONDITION,
        title: t('Condition'),
        className: 'min-w-[160px]',
        render: (_, record) => (
          <ConditionCell value={record.condition} isDark={isDark} />
        ),
      },
      {
        key: COLUMN_KEYS.CATEGORY,
        title: t('Report type'),
        className: 'min-w-[180px]',
        render: (_, record) => {
          const label = reportCategoryLabel(record.category);
          return (
            <span className={cn('font-display-1', isDark ? 'text-zinc-200' : 'text-foreground')}>
              {label ? t(label) : '—'}
            </span>
          );
        },
      },
      {
        key: COLUMN_KEYS.WASTE_TYPE,
        title: t('Waste Type'),
        className: 'min-w-[200px]',
        render: (_, record) => (
          <WasteTypeCell value={record.waste_type} isDark={isDark} />
        ),
      },
      {
        key: COLUMN_KEYS.OWNER,
        title: t('Owner'),
        className: 'min-w-[180px]',
        render: (_, record) => (
          <div className="flex flex-row items-center justify-center gap-2">
            <Image
              src={record?.user?.avatar || defaultAvatar}
              alt={record?.user?.name || ''}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex flex-col">
              <span className={cn('font-display-1', isDark ? 'text-zinc-200' : 'text-foreground')}>
                {record?.user?.name}
              </span>
              <p className={cn('font-display-1', isDark ? 'text-zinc-400' : 'text-muted-foreground')}>
                {formattedDate(record.created_at ?? undefined)}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.AI_ANALYSIS,
        title: t('AI Analysis'),
        className: 'min-w-[88px]',
        render: (_, record) => {
          const urls = (record.media_files ?? [])
            .map((m) => m.ai_analysis_url)
            .filter((u): u is string => Boolean(u));
          if (urls.length === 0) {
            return (
              <span
                className={cn(
                  'text-xs tabular-nums',
                  isDark ? 'text-zinc-500' : 'text-muted-foreground',
                )}
              >
                —
              </span>
            );
          }
          return (
            <AntdImage.PreviewGroup>
              <div className="relative flex h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted">
                <AntdImage
                  src={urls[0]}
                  alt={t('AI Analysis')}
                  width={48}
                  height={48}
                  className="object-cover"
                  preview
                />
              </div>
              {urls.length > 1 ? (
                <div className="hidden" aria-hidden>
                  {urls.slice(1).map((url, idx) => (
                    <AntdImage key={`${url}-${idx}`} src={url} preview />
                  ))}
                </div>
              ) : null}
            </AntdImage.PreviewGroup>
          );
        },
      },
      {
        key: COLUMN_KEYS.STATUS,
        title: t('Status'),
        className: 'min-w-[120px]',
        render: (_, record) => {
          const outcome = reportOutcomeOf(record.status);
          // Legacy reports (no verification) keep their status tag; a ban without one is still "Banned".
          if (outcome && (record.latest_verification || outcome !== 'rejected')) {
            return (
              <Pill tone={REPORT_OUTCOME_TONE[outcome]} isDark={isDark}>
                {t(REPORT_OUTCOME_LABEL[outcome])}
              </Pill>
            );
          }
          return (
            <StatusTag
              status={record.status}
              isDark={isDark}
              label={record.status === STATUS.INACTIVE ? t('Banned') : undefined}
            />
          );
        },
      },
      {
        key: COLUMN_KEYS.RISK,
        title: t('Risk'),
        className: 'min-w-[80px]',
        render: (_, record) => {
          const risk = record.latest_verification?.risk_score;
          if (risk == null) return <span className={isDark ? 'text-zinc-500' : 'text-muted-foreground'}>—</span>;
          return (
            <span className={cn('font-mono text-sm font-semibold', isDark ? 'text-zinc-200' : 'text-foreground')}>
              {risk.toFixed(2)}
            </span>
          );
        },
      },
      {
        key: COLUMN_KEYS.REJECT_REASON,
        title: t('Reject Reason'),
        className: 'min-w-[220px]',
        render: (_, record) => (
          <RichTextContent
            value={record.reject_reason?.trim() ?? ''}
            className={cn('font-display-1 whitespace-pre-wrap break-words', isDark ? 'text-zinc-400' : 'text-muted-foreground')}
            maxLines={2}
            showMoreLabel={t('See more')}
            showLessLabel={t('See less')}
            emptyFallback={<span className={isDark ? 'text-zinc-400' : 'text-muted-foreground'}>—</span>}
          />
        ),
      },
      {
        key: COLUMN_KEYS.HANDLED_BY,
        title: t('Handled by'),
        className: 'min-w-[180px]',
        render: (_, record) => {
          const handledBy = record.handled_by;
          return handledBy ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                {handledBy?.logo_url ? (
                  <Image
                    src={handledBy.logo_url}
                    alt={handledBy.name || t('Handled by')}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex flex-col">
                <span className={cn('font-display-1', isDark ? 'text-zinc-200' : 'text-foreground')}>
                  {handledBy?.name || '—'}
                </span>
                <span className={cn('text-xs', isDark ? 'text-zinc-400' : 'text-muted-foreground')}>
                  {handledBy ? t('Admin Organization') : '—'}
                </span>
              </div>
            </div>
          ) : <></>;
        },
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t('Action'),
        className: 'min-w-[72px]',
        sticky: 'right',
        render: (_, record) => {
          const detailHref = `/admin/reports/${record.id}${moderation ? `?from=${moderation}&page=${pagination.current}&limit=${pagination.pageSize}` : ''}`;

          return (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={detailHref}
                    aria-label={t('View detail')}
                    className={cn(
                      'cursor-pointer rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors duration-200',
                      isDark
                        ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300'
                        : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700',
                    )}
                  >
                    <TbFileDescription className="size-5" aria-hidden />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{t('View detail')}</TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [isDark, moderation, pagination.current, pagination.pageSize, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={incidents}
      loading={loading}
      rowKey="id"
      emptyTitle={t('No incidents found')}
      emptyDescription={t('No incidents available for the current filters.')}
      onRowClick={handleRowClick}
      pagination={{
        page: pagination.current,
        pageSize: pagination.pageSize,
        total,
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
