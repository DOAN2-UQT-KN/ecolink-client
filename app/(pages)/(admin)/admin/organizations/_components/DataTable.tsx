import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { IOrganization } from '@/apis/organization/models/organization';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { StatusTag } from '@/components/ui/StatusTag';
import { cn } from '@/libs/utils';
import { useOrganizationContext } from '../_context/OrganizationContext';
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from '@/components/admin/shared/DataTable';
import { PreviewOrganizationPopover } from './PreviewOrganizationPopover';
import { ApproveOrganizationConfirm } from './ApproveOrganizationConfirm';
import { TbCircleCheck, TbCircleX, TbScanEye } from 'react-icons/tb';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { formattedDate } from '@/utils/formattedDate';
import Image from '@/components/ui/AppImage';
import defaultAvatar from '@/public/default-avatar.png';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { STATUS } from '@/constants/status';

const COLUMN_KEYS = {
  NO: 'no',
  NAME_LOGO: 'name_logo',
  MEMBERS: 'members',
  CREATED: 'created',
  STATUS: 'status',
  REJECT_REASON: 'reject_reason',
  DESCRIPTION: 'description',
  ACTION: 'action',
} as const;

export function DataTable() {
  const { t } = useTranslation();
  const { description: localizedDescription, locale } = useLocalizedDisplay();
  const { organizations, loading, pagination, total, onPageChange, onPageSizeChange } =
    useOrganizationContext();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';

  const handleRowClick = useCallback((record: IOrganization) => {
    if (!record.slug || record.status === STATUS.INACTIVE) return;
    window.open(`/organizations/${record.slug}`, '_blank', 'noopener,noreferrer');
  }, []);

  const columns: DataTableColumn<IOrganization>[] = useMemo(
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
        key: COLUMN_KEYS.NAME_LOGO,
        title: t('Organization'),
        className: ' z-20 min-w-[220px]',
        render: (_, record) => (
          <div className="flex items-center gap-3">
            {record.logo_url ? (
              <img
                src={record.logo_url}
                alt={record.name}
                className={cn(
                  'h-9 w-9 shrink-0 rounded-full object-cover ring-1',
                  isDark ? 'ring-zinc-600' : 'ring-zinc-300',
                )}
              />
            ) : (
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display-1 uppercase',
                  isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600',
                )}
              >
                {record.name.slice(0, 2)}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <div
                className={cn(
                  'flex min-w-0 items-center gap-1.5 font-medium',
                  isDark ? 'text-zinc-100' : 'text-zinc-900',
                )}
              >
                <span className="truncate">{record.name}</span>
                {record.is_email_verified ? (
                  <TbCircleCheck
                    className="size-4 shrink-0 text-emerald-500"
                    aria-label={t('Verified')}
                    title={t('Verified')}
                  />
                ) : (
                  <TbCircleX
                    className="size-4 shrink-0 text-red-500"
                    aria-label={t('Unverified')}
                    title={t('Unverified')}
                  />
                )}
              </div>
              <span
                className={cn(
                  'truncate text-xs',
                  isDark ? 'text-zinc-500' : 'text-zinc-600',
                )}
              >
                {record.contact_email || '—'}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.MEMBERS,
        title: t('Members'),
        className: 'min-w-[100px]',
        render: (_, record) => (
          <span
            className={cn(
              'tabular-nums font-display-1 text-center',
              isDark ? 'text-zinc-300' : 'text-zinc-700',
            )}
          >
            {record.members ?? 0}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.CREATED,
        title: t('Owner'),
        className: 'min-w-[180px]',
        render: (_, record) => (
          <div className="flex flex-row items-center justify-start gap-2">
            <Image
              src={record?.owner?.avatar || defaultAvatar}
              alt={record?.owner?.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex flex-col">
              <span className={cn('font-medium', isDark ? 'text-zinc-100' : 'text-zinc-900')}>
                {record?.owner?.name}
              </span>
              <p className={cn('font-display-1', isDark ? 'text-zinc-500' : 'text-zinc-600')}>
                {formattedDate(record.created_at ?? undefined)}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.STATUS,
        title: t('Status'),
        className: 'min-w-[120px]',
        render: (_, record) => (
          <StatusTag
            status={record.status}
            className="!mx-0 min-w-0 justify-center"
            label={record.status === STATUS.INACTIVE ? t('Banned') : undefined}
          />
        ),
      },
      {
        key: COLUMN_KEYS.DESCRIPTION,
        title: t('Description'),
        className: 'min-w-[260px]',
        render: (_, record) => (
          <RichTextContent
            value={localizedDescription(record)}
            className="text-sm text-foreground whitespace-pre-wrap break-words !font-display-1"
            maxLines={2}
            showMoreLabel={t('See more')}
            showLessLabel={t('See less')}
            emptyFallback={<span className="text-foreground-secondary">—</span>}
          />
        ),
      },
      {
        key: COLUMN_KEYS.REJECT_REASON,
        title: t('Ban Reason'),
        className: 'min-w-[220px]',
        render: (_, record) => (
          <RichTextContent
            value={record.reject_reason?.trim() ?? ''}
            className="text-sm text-foreground whitespace-pre-wrap break-words !font-display-1"
            maxLines={2}
            showMoreLabel={t('See more')}
            showLessLabel={t('See less')}
            emptyFallback={<span className="text-foreground-secondary">—</span>}
          />
        ),
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t('Action'),
        className: 'min-w-[160px]',
        render: (_, record) => (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <PreviewOrganizationPopover
              name={record.name}
              description={localizedDescription(record)}
              logoUrl={record.logo_url ?? ''}
              backgroundUrl={record.background_url ?? ''}
              contactEmail={record.contact_email ?? ''}
              theme={isDark ? 'dark' : 'light'}
              trigger={
                <button
                  type="button"
                  className={cn(
                    'rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200',
                    isDark
                      ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300'
                      : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700',
                  )}
                >
                  <TbScanEye className="size-5" />
                </button>
              }
            />
            {record.status === STATUS.ACTIVE ? (
              <ApproveOrganizationConfirm
                mode="ban"
                organizationId={record.id}
                organizationName={record.name}
                theme={isDark ? 'dark' : 'light'}
              />
            ) : record.status !== STATUS.INACTIVE ? (
              <ApproveOrganizationConfirm
                organizationId={record.id}
                organizationName={record.name}
                theme={isDark ? 'dark' : 'light'}
              />
            ) : null}
          </div>
        ),
      },
    ],
    [isDark, pagination.current, pagination.pageSize, t, locale, localizedDescription],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={organizations}
      loading={loading}
      rowKey="id"
      emptyTitle="No organizations found"
      emptyDescription="No organizations available for the current filters."
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
