import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ISosSummary } from '@/apis/sos/models/sos';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from '@/components/admin/shared/DataTable';
import { SosStatePill, SosTypeBadge } from '@/components/sos/SosTypeBadge';
import { SOS_RESOLUTION_CODES, SOS_ROLE_LABEL } from '@/constants/sos';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';
import { useSosContext } from '../_context/SosContext';

const COLUMN_KEYS = {
  ID: 'id',
  TYPE: 'type',
  STATE: 'state',
  CAMPAIGN: 'campaign',
  REPORTER: 'reporter',
  PHONE: 'phone',
  PEOPLE: 'people',
  CREATED_AT: 'created_at',
  CLOSURE: 'closure',
} as const;

export const DataTable = memo(function DataTable() {
  const { t } = useTranslation();
  const { sosList, loading, pagination, total, onPageChange, onPageSizeChange } =
    useSosContext();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';

  const handleRowClick = useCallback((record: ISosSummary) => {
    window.open(`/sos/${record.id}`, '_blank', 'noopener,noreferrer');
  }, []);

  const columns: DataTableColumn<ISosSummary>[] = useMemo(() => {
    const primaryText = isDark ? 'text-zinc-100' : 'text-zinc-900';
    const secondaryText = isDark ? 'text-zinc-400' : 'text-zinc-600';
    const dash = <span className={isDark ? 'text-zinc-500' : 'text-muted-foreground'}>—</span>;

    return [
      {
        key: COLUMN_KEYS.ID,
        title: t('ID'),
        className: 'w-[72px]',
        render: (_, record) => (
          <span className={cn('tabular-nums font-medium', primaryText)}>#{record.id}</span>
        ),
      },
      {
        key: COLUMN_KEYS.TYPE,
        title: t('Type'),
        className: 'min-w-[180px]',
        render: (_, record) => <SosTypeBadge type={record.type} isDark={isDark} />,
      },
      {
        key: COLUMN_KEYS.STATE,
        title: t('Status'),
        className: 'min-w-[130px]',
        render: (_, record) => <SosStatePill state={record.state} isDark={isDark} />,
      },
      {
        key: COLUMN_KEYS.CAMPAIGN,
        title: t('Campaign'),
        className: 'min-w-[220px] max-w-[320px]',
        render: (_, record) => (
          <span className={cn('font-medium line-clamp-2', primaryText)}>
            {record.campaign_title || '—'}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.REPORTER,
        title: t('Reporter'),
        className: 'min-w-[170px]',
        render: (_, record) =>
          record.reporter || record.reporter_role ? (
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={cn('font-medium truncate', primaryText)}>
                {record.reporter?.name || '—'}
              </span>
              {record.reporter_role ? (
                <span className={cn('text-xs', secondaryText)}>
                  {t(SOS_ROLE_LABEL[record.reporter_role])}
                </span>
              ) : null}
            </div>
          ) : (
            dash
          ),
      },
      {
        key: COLUMN_KEYS.PHONE,
        title: t('Phone'),
        className: 'min-w-[130px]',
        render: (_, record) =>
          record.phone ? (
            <span className={cn('tabular-nums', primaryText)}>{record.phone}</span>
          ) : (
            dash
          ),
      },
      {
        key: COLUMN_KEYS.PEOPLE,
        title: t('People coming'),
        className: 'min-w-[190px]',
        render: (_, record) => (
          <span className={cn('text-sm tabular-nums', isDark ? 'text-zinc-300' : 'text-zinc-700')}>
            {t('{{onWay}} on the way · {{arrived}} arrived', {
              onWay: record.on_the_way_count,
              arrived: record.arrived_count,
            })}
            {record.type === 'manpower' && record.people_needed
              ? ` ${t('/ {{needed}} needed', { needed: record.people_needed })}`
              : null}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.CREATED_AT,
        title: t('Created at'),
        className: 'min-w-[150px]',
        render: (_, record) => (
          <span
            className={cn(
              'tabular-nums !font-display-1',
              isDark ? 'text-zinc-300' : 'text-zinc-700',
            )}
          >
            {formattedDate(record.created_at, true)}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.CLOSURE,
        title: t('Closure'),
        className: 'min-w-[160px]',
        render: (_, record) => {
          const code = SOS_RESOLUTION_CODES.find((c) => c.value === record.resolution_code);
          if (!code && !record.resolved_at) return dash;
          return (
            <div className="flex flex-col gap-0.5">
              <span className={cn('font-medium', primaryText)}>
                {code ? t(code.label) : t('Resolved')}
              </span>
              {record.resolved_at ? (
                <span className={cn('text-xs tabular-nums', secondaryText)}>
                  {formattedDate(record.resolved_at, true)}
                </span>
              ) : null}
            </div>
          );
        },
      },
    ];
  }, [isDark, t]);

  return (
    <SharedDataTable
      columns={columns}
      data={sosList}
      loading={loading}
      rowKey="id"
      emptyTitle={t('No SOS found')}
      emptyDescription={t('No SOS matches the current filters.')}
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
});

export default DataTable;
