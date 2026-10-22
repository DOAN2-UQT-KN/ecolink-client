import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetStockBatches } from '@/apis/gift-stock/getStockBatches';
import { useGetStockMovements } from '@/apis/gift-stock/getStockMovements';
import type { IStockMovement, StockMovementType } from '@/apis/gift-stock/models/stock';
import { DataTable as SharedDataTable, type DataTableColumn } from '@/components/admin/shared/DataTable';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';
import { ADJUST_REASON_LABEL, MOVEMENT_TYPE_LABEL, MOVEMENT_TYPES } from '../../_services/stockForm.service';

const PAGE_SIZE = 20;
const ALL = 'all';

/** Every stock change of the gift, newest first; rows are never edited (spec 015 FR-046). */
export function MovementTable({ giftId }: { giftId: string }) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const [page, setPage] = useState(1);
  const [type, setType] = useState<StockMovementType | undefined>();
  const [batchId, setBatchId] = useState<string | undefined>();
  const { data, isLoading, isError, refetch } = useGetStockMovements({ giftId, page, limit: PAGE_SIZE, type, batchId });
  const batchesQuery = useGetStockBatches({ giftId, limit: 100 });
  const batches = batchesQuery.data?.data?.batches ?? [];

  const columns: DataTableColumn<IStockMovement>[] = useMemo(
    () => [
      { key: 'createdAt', title: t('Time'), width: 170, render: (_v, r) => <span className="text-sm">{formattedDate(r.createdAt, true)}</span> },
      { key: 'type', title: t('Change'), render: (_v, r) => <span className="text-sm">{t(MOVEMENT_TYPE_LABEL[r.type])}</span> },
      { key: 'source', title: t('Batch'), render: (_v, r) => <span className="text-sm [overflow-wrap:anywhere]">{r.sourceName ?? '—'}</span> },
      {
        key: 'quantity',
        title: t('Quantity'),
        render: (_v, r) => (
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              r.quantity > 0 ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : isDark ? 'text-red-300' : 'text-red-700',
            )}
          >
            {r.quantity > 0 ? `+${r.quantity}` : `−${Math.abs(r.quantity)}`}
          </span>
        ),
      },
      {
        key: 'reason',
        title: t('Reason'),
        render: (_v, r) => (
          <span className="text-sm [overflow-wrap:anywhere]">
            {r.reason ? t(ADJUST_REASON_LABEL[r.reason]) : '—'}
            {r.note ? ` · ${r.note}` : ''}
          </span>
        ),
      },
      { key: 'actor', title: t('By'), render: (_v, r) => <span className="text-sm">{r.actor ? r.actor.name || r.actor.id.slice(0, 8) : t('System')}</span> },
      { key: 'order', title: t('Order'), render: (_v, r) => <span className="text-sm">{r.redemptionId ? r.redemptionId.slice(0, 8) : '—'}</span> },
    ],
    [isDark, t],
  );

  const triggerClass = '!h-10 w-full !border !border-input';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 rounded-[10px] border border-border bg-card p-4 md:grid-cols-2">
        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">{t('Change')}</FieldLabel>
          <Select
            value={type ?? ALL}
            onValueChange={(v) => {
              setType(v === ALL ? undefined : (v as StockMovementType));
              setPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('All')}</SelectItem>
              {MOVEMENT_TYPES.map((m) => (
                <SelectItem key={m} value={m}>
                  {t(MOVEMENT_TYPE_LABEL[m])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">{t('Batch')}</FieldLabel>
          <Select
            value={batchId ?? ALL}
            onValueChange={(v) => {
              setBatchId(v === ALL ? undefined : v);
              setPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('All')}</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {`${b.source?.name ?? ''} · ${formattedDate(b.receivedAt)} · ${b.reference}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <SharedDataTable
        columns={columns}
        data={data?.data?.movements ?? []}
        loading={isLoading}
        error={isError ? t('Could not load the stock history.') : undefined}
        onRetry={() => refetch()}
        rowKey="id"
        emptyTitle={t('No stock changes yet')}
        emptyDescription={t('Receiving, redeeming and writing off stock all appear here.')}
        pagination={{ page, pageSize: PAGE_SIZE, total: data?.data?.total ?? 0, onPageChange: setPage }}
      />
    </div>
  );
}
