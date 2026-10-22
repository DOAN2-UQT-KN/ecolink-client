import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbPaperclip } from 'react-icons/tb';

import { useGetGiftSourceBatches } from '@/apis/gift-source/getGiftSourceBatches';
import type { IStockBatch } from '@/apis/gift-stock/models/stock';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { DataTable as SharedDataTable, type DataTableColumn } from '@/components/admin/shared/DataTable';
import { Pill } from '@/components/ui/Pill';
import { STOCK_BATCH_LABEL, STOCK_BATCH_TONE } from '@/constants/statusTone';
import { Link } from '@/libs/router';
import { formattedDate } from '@/utils/formattedDate';

type Row = IStockBatch & { gift: { id: string; name: string } };

const PAGE_SIZE = 10;

/** Batches received from one source (spec 015 FR-006). */
export function SourceBatchesTab({ sourceId }: { sourceId: string }) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetGiftSourceBatches({ id: sourceId, page, limit: PAGE_SIZE });

  const columns: DataTableColumn<Row>[] = useMemo(
    () => [
      {
        key: 'gift',
        title: t('Gift'),
        className: 'min-w-[180px]',
        render: (_v, r) => (
          <Link href={`/admin/gifts/${r.gift.id}/stock`} className="text-sm font-medium hover:underline [overflow-wrap:anywhere]">
            {r.gift.name}
          </Link>
        ),
      },
      { key: 'receivedAt', title: t('Received on'), render: (_v, r) => <span className="text-sm">{formattedDate(r.receivedAt)}</span> },
      { key: 'quantity', title: t('Received'), render: (_v, r) => <span className="text-sm tabular-nums">{r.quantity}</span> },
      { key: 'remaining', title: t('Left'), render: (_v, r) => <span className="text-sm tabular-nums">{r.remaining}</span> },
      { key: 'expiresAt', title: t('Expires on'), render: (_v, r) => <span className="text-sm">{r.expiresAt ? formattedDate(r.expiresAt) : '—'}</span> },
      { key: 'unitValueVnd', title: t('Value per item (VND)'), render: (_v, r) => <span className="text-sm tabular-nums">{r.unitValueVnd.toLocaleString('vi-VN')}</span> },
      {
        key: 'reference',
        title: t('Reference'),
        render: (_v, r) => (
          <div className="flex flex-col gap-1 text-sm">
            <span className="[overflow-wrap:anywhere]">{r.reference || '—'}</span>
            {r.attachmentUrls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <TbPaperclip className="size-3.5" aria-hidden />
                {t('Document {{n}}', { n: i + 1 })}
              </a>
            ))}
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
    ],
    [isDark, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={(data?.data?.batches ?? []) as Row[]}
      loading={isLoading}
      error={isError ? t('Could not load the batches.') : undefined}
      onRetry={() => refetch()}
      rowKey="id"
      emptyTitle={t('No batches received yet')}
      emptyDescription={t('Batches appear here once stock is received from this source.')}
      pagination={{ page, pageSize: PAGE_SIZE, total: data?.data?.total ?? 0, onPageChange: setPage }}
    />
  );
}
