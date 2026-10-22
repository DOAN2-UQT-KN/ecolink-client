import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TbCircleMinus, TbPaperclip } from 'react-icons/tb';

import type { IStockBatch } from '@/apis/gift-stock/models/stock';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { DataTable as SharedDataTable, type DataTableColumn } from '@/components/admin/shared/DataTable';
import { Pill } from '@/components/ui/Pill';
import { STOCK_BATCH_LABEL, STOCK_BATCH_TONE } from '@/constants/statusTone';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';

type Props = {
  batches: IStockBatch[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onWriteOff: (batch: IStockBatch) => void;
};

/** Batches in the order redemptions take from them. */
export function BatchTable({ batches, loading, error, onRetry, page, pageSize, total, onPageChange, onWriteOff }: Props) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';

  const columns: DataTableColumn<IStockBatch>[] = useMemo(
    () => [
      { key: 'source', title: t('Gift source'), className: 'min-w-[160px]', render: (_v, r) => <span className="text-sm [overflow-wrap:anywhere]">{r.source?.name ?? '—'}</span> },
      { key: 'receivedAt', title: t('Received on'), render: (_v, r) => <span className="text-sm">{formattedDate(r.receivedAt)}</span> },
      {
        key: 'remaining',
        title: t('Left / received'),
        className: 'min-w-[140px]',
        render: (_v, r) => {
          const pct = r.quantity > 0 ? Math.round((r.remaining / r.quantity) * 100) : 0;
          return (
            <div className="space-y-1.5">
              <p className="text-sm tabular-nums">
                <span className="font-semibold">{r.remaining}</span>
                <span className="text-foreground-secondary"> / {r.quantity}</span>
              </p>
              <div className={cn('h-1.5 w-24 overflow-hidden rounded-full', isDark ? 'bg-zinc-700' : 'bg-zinc-200')} aria-hidden>
                <div
                  className={cn('h-full rounded-full', r.state === 'EXPIRED' ? 'bg-red-400' : r.state === 'EXPIRING_SOON' ? 'bg-amber-500' : 'bg-emerald-500')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      { key: 'expiresAt', title: t('Expires on'), render: (_v, r) => <span className="text-sm">{r.expiresAt ? formattedDate(r.expiresAt) : '—'}</span> },
      {
        key: 'reference',
        title: t('Reference'),
        className: 'min-w-[160px]',
        render: (_v, r) => (
          <div className="space-y-1.5">
            <p className="text-sm [overflow-wrap:anywhere]">{r.reference || '—'}</p>
            {r.attachmentUrls.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5" aria-label={t('Documents')}>
                {r.attachmentUrls.map((url, i) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      title={t('Document {{n}}', { n: i + 1 })}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs transition-colors duration-150',
                        isDark ? 'border-zinc-700 text-blue-300 hover:bg-zinc-800' : 'border-border text-blue-700 hover:bg-blue-50',
                      )}
                    >
                      <TbPaperclip className="size-3.5" aria-hidden />
                      {t('Document {{n}}', { n: i + 1 })}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ),
      },
      {
        key: 'state',
        title: t('Status'),
        render: (_v, r) => (
          <Pill tone={STOCK_BATCH_TONE[r.state]} isDark={isDark}>
            {t(STOCK_BATCH_LABEL[r.state])}
          </Pill>
        ),
      },
      {
        key: 'actions',
        title: t('Action'),
        render: (_v, r) =>
          r.remaining > 0 ? (
            <button
              type="button"
              onClick={() => onWriteOff(r)}
              aria-label={t('Write off')}
              title={t('Write off')}
              className={cn(
                'cursor-pointer rounded-md border px-1.5 py-1.5 transition-colors duration-200',
                isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-red-300' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-red-700',
              )}
            >
              <TbCircleMinus className="size-5" aria-hidden />
            </button>
          ) : null,
      },
    ],
    [isDark, onWriteOff, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={batches}
      loading={loading}
      error={error ? t('Could not load the batches.') : undefined}
      onRetry={onRetry}
      rowKey="id"
      emptyTitle={t('No stock yet')}
      emptyDescription={t('Receive a batch from a gift source to make this gift redeemable.')}
      pagination={{ page, pageSize, total, onPageChange }}
    />
  );
}
