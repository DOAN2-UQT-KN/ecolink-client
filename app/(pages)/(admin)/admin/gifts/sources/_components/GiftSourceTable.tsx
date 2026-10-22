import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TbPencil, TbPlayerPause, TbPlayerPlay } from 'react-icons/tb';

import { useUpdateGiftSource } from '@/apis/gift-source/updateGiftSource';
import type { IGiftSource } from '@/apis/gift-source/models/giftSource';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { DataTable as SharedDataTable, type DataTableColumn } from '@/components/admin/shared/DataTable';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Link } from '@/libs/router';
import { cn } from '@/libs/utils';
import { GIFT_SOURCE_TYPE_LABEL } from '../_services/giftSourceForm.service';
import { GiftSourceStatusPill } from './GiftSourceStatusPill';
import { SourceAvatar } from '../../_components/SourceAvatar';

type Props = {
  sources: IGiftSource[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (source: IGiftSource) => void;
};

export function GiftSourceTable({ sources, loading, error, onRetry, page, pageSize, total, onPageChange, onPageSizeChange, onEdit }: Props) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const { mutateAsync: updateSource, isPending } = useUpdateGiftSource();

  const buttonClass = cn(
    'cursor-pointer rounded-md border px-1.5 py-1.5 transition-colors duration-200',
    isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100',
  );

  const columns: DataTableColumn<IGiftSource>[] = useMemo(
    () => [
      {
        key: 'name',
        title: t('Name'),
        className: 'min-w-[200px]',
        render: (_v, r) => (
          <div className="flex items-center gap-3">
            <SourceAvatar name={r.name} logoUrl={r.logo?.url} className="size-9 text-sm" />
            <Link href={`/admin/gifts/sources/${r.id}`} className={cn('min-w-0 text-sm font-medium hover:underline [overflow-wrap:anywhere]', isDark ? 'text-zinc-100' : 'text-zinc-900')}>
              {r.name}
            </Link>
          </div>
        ),
      },
      { key: 'type', title: t('Source type'), className: 'w-[160px]', render: (_v, r) => <span className="text-sm">{t(GIFT_SOURCE_TYPE_LABEL[r.type])}</span> },
      { key: 'status', title: t('Status'), className: 'w-[130px]', render: (_v, r) => <GiftSourceStatusPill status={r.status} isDark={isDark} /> },
      {
        key: 'showOnGift',
        title: t('Shown as sponsor'),
        className: 'w-[140px]',
        render: (_v, r) => <span className="text-sm">{r.showOnGift ? t('Shown') : t('Not shown')}</span>,
      },
      { key: 'batchCount', title: t('Batches'), className: 'w-[100px]', render: (_v, r) => <span className="text-sm tabular-nums">{r.batchCount}</span> },
      {
        key: 'actions',
        title: t('Action'),
        className: 'w-[180px]',
        render: (_v, r) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} role="presentation">
            <button type="button" className={buttonClass} onClick={() => onEdit(r)} aria-label={t('Edit gift source')} title={t('Edit gift source')}>
              <TbPencil className="size-5" aria-hidden />
            </button>
            <ConfirmPopover
              theme={theme}
              title={r.status === 'ACTIVE' ? t('Stop this source?') : t('Partner with this source again?')}
              description={
                r.status === 'ACTIVE'
                  ? t('No new batches can be received from it. Items already in stock can still be redeemed.')
                  : t('New batches can be received from it again.')
              }
              confirmLabel={r.status === 'ACTIVE' ? t('Stop') : t('Activate')}
              cancelLabel={t('Cancel')}
              confirmPending={isPending}
              onConfirm={async () => {
                await updateSource({ id: r.id, data: { status: r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } });
              }}
              trigger={
                <button
                  type="button"
                  className={buttonClass}
                  disabled={isPending}
                  aria-label={r.status === 'ACTIVE' ? t('Stop') : t('Activate')}
                  title={r.status === 'ACTIVE' ? t('Stop') : t('Activate')}
                >
                  {r.status === 'ACTIVE' ? <TbPlayerPause className="size-5" aria-hidden /> : <TbPlayerPlay className="size-5" aria-hidden />}
                </button>
              }
            />
          </div>
        ),
      },
    ],
    [buttonClass, isDark, isPending, onEdit, t, theme, updateSource],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={sources}
      loading={loading}
      error={error ? t('Could not load gift sources.') : undefined}
      onRetry={onRetry}
      rowKey="id"
      emptyTitle={t('No gift sources yet')}
      emptyDescription={t('Create a source before receiving stock.')}
      pagination={{ page, pageSize, total, onPageChange, onPageSizeChange }}
    />
  );
}
