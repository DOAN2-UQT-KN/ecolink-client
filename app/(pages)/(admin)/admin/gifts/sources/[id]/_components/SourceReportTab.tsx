import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { TbDownload } from 'react-icons/tb';

import { downloadGiftSourceReportCsv, useGetGiftSourceReport } from '@/apis/gift-source/getGiftSourceReport';
import type { IGiftSourceReportRow } from '@/apis/gift-source/models/giftSource';
import { DataTable as SharedDataTable, type DataTableColumn } from '@/components/admin/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

type GiftRow = IGiftSourceReportRow & { giftId: string; giftName: string };

/** YYYY-MM-DD of a moment in UTC+7, the timezone the report uses. */
const vnDate = (d: Date) => new Date(d.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

const shrinkTotal = (r: IGiftSourceReportRow) =>
  r.shrinkage.DAMAGED + r.shrinkage.LOST + r.shrinkage.COUNT_SHORTAGE + r.shrinkage.RETURN_TO_SOURCE;

export function SourceReportTab({ sourceId }: { sourceId: string }) {
  const { t } = useTranslation();
  const [to, setTo] = useState(() => vnDate(new Date()));
  const [from, setFrom] = useState(() => vnDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
  const [downloading, setDownloading] = useState(false);
  const rangeValid = Boolean(from && to && from <= to);
  const { data, isLoading, isError, refetch } = useGetGiftSourceReport({ id: sourceId, from, to }, { enabled: rangeValid });
  const report = data?.data?.report;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadGiftSourceReportCsv({ id: sourceId, from, to });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `gift-source-${sourceId}-${from}-${to}.csv`;
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('Could not export the report.') });
    } finally {
      setDownloading(false);
    }
  };

  const columns: DataTableColumn<GiftRow>[] = useMemo(
    () => [
      { key: 'giftName', title: t('Gift'), className: 'min-w-[160px]', render: (_v, r) => <span className="text-sm [overflow-wrap:anywhere]">{r.giftName}</span> },
      { key: 'received', title: t('Received'), render: (_v, r) => <span className="text-sm tabular-nums">{r.received}</span> },
      { key: 'delivered', title: t('Given out'), render: (_v, r) => <span className="text-sm tabular-nums">{r.delivered}</span> },
      { key: 'holding', title: t('Held for orders'), render: (_v, r) => <span className="text-sm tabular-nums">{r.holding}</span> },
      { key: 'shrink', title: t('Written off'), render: (_v, r) => <span className="text-sm tabular-nums">{shrinkTotal(r)}</span> },
      { key: 'expired', title: t('Expired'), render: (_v, r) => <span className="text-sm tabular-nums">{r.expired}</span> },
      { key: 'inStock', title: t('In stock'), render: (_v, r) => <span className="text-sm tabular-nums">{r.inStock}</span> },
      { key: 'value', title: t('Value given (VND)'), render: (_v, r) => <span className="text-sm tabular-nums">{r.valueDeliveredVnd.toLocaleString('vi-VN')}</span> },
      { key: 'recipients', title: t('Recipients'), render: (_v, r) => <span className="text-sm tabular-nums">{r.recipients}</span> },
    ],
    [t],
  );

  const totals = report?.totals;
  const figures: Array<[string, string]> = totals
    ? [
        [t('Received'), String(totals.received)],
        [t('Given out'), String(totals.delivered)],
        [t('Held for orders'), String(totals.holding)],
        [t('Damaged'), String(totals.shrinkage.DAMAGED)],
        [t('Lost'), String(totals.shrinkage.LOST)],
        [t('Count shortage'), String(totals.shrinkage.COUNT_SHORTAGE)],
        [t('Returned to source'), String(totals.shrinkage.RETURN_TO_SOURCE)],
        [t('Expired'), String(totals.expired)],
        [t('In stock'), String(totals.inStock)],
        [t('Value given (VND)'), totals.valueDeliveredVnd.toLocaleString('vi-VN')],
        [t('Recipients'), String(totals.recipients)],
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[10px] border border-border bg-card p-4 sm:flex-row sm:items-end">
        <Field className="sm:w-48">
          <FieldLabel htmlFor="report-from">{t('From')}</FieldLabel>
          <Input id="report-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-10" />
        </Field>
        <Field className="sm:w-48">
          <FieldLabel htmlFor="report-to">{t('To')}</FieldLabel>
          <Input id="report-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-10" />
        </Field>
        <Button type="button" variant="outline" onClick={handleDownload} disabled={!rangeValid || downloading} className="!h-10 cursor-pointer px-4 sm:ml-auto">
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <TbDownload className="size-4" aria-hidden />}
          {t('Export CSV')}
        </Button>
      </div>
      {!rangeValid ? <p className="text-sm text-red-500">{t('The start date must not be after the end date.')}</p> : null}

      {totals ? (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {figures.map(([label, value]) => (
            <div key={label} className="rounded-[10px] border border-border bg-card p-3">
              <dt className="text-xs text-foreground-secondary">{label}</dt>
              <dd className="text-lg font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <SharedDataTable
        columns={columns}
        data={report?.gifts ?? []}
        loading={isLoading && rangeValid}
        error={isError ? t('Could not load the report.') : undefined}
        onRetry={() => refetch()}
        rowKey="giftId"
        emptyTitle={t('Nothing in this period')}
        emptyDescription={t('No stock from this source moved in the selected dates.')}
      />
    </div>
  );
}
