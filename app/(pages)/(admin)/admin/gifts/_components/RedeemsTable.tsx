import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useGetAdminGiftRedemptions,
  useUpdateGiftRedemptionStatus,
} from '@/apis/gift/adminGiftRedemptions';
import { useGetGiftSources } from '@/apis/gift-source/getGiftSources';
import type {
  GiftRedemptionStatus,
  IAdminGiftRedemptionListItem,
} from '@/apis/gift/models/gift';
import { CancelRedemptionDialog } from './CancelRedemptionDialog';
import { ShipOrderDialog } from './ShipOrderDialog';
import { REDEEM_STATUSES, useRedeemFilters } from '../_hooks/useRedeemFilters';
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from '@/components/admin/shared/DataTable';
import { Pill } from '@/components/ui/Pill';
import { GIFT_REDEEM_TONE } from '@/constants/statusTone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formattedDate } from '@/utils/formattedDate';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { cn } from '@/libs/utils';
import type { IconType } from 'react-icons';
import { TbCircleCheck, TbEdit, TbGift, TbSearch, TbTruckDelivery, TbX } from 'react-icons/tb';
import { Image } from 'antd';
import { TooltipTruncatedText } from '@/components/ui/TooltipTruncatedText';
import { displayPhone } from '@/utils/phone';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { Link, useRouter } from '@/libs/router';

const PAGE_SIZE = 10;
// Every cell follows the recipient column: one main line, then smaller grey details.
const PRIMARY = 'text-sm font-medium text-foreground [overflow-wrap:anywhere]';
const SECONDARY = 'text-xs text-muted-foreground [overflow-wrap:anywhere]';
// Clicks inside these must not also open the order (the row navigates on click).
const stopRowClick = (e: { stopPropagation: () => void }) => e.stopPropagation();
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * One icon action per next status; the server decides which ones apply (allowedTransitions).
 * Ship and cancel open their own dialogs; the others ask `confirm` first.
 */
const STATUS_ACTION: Partial<Record<GiftRedemptionStatus, { icon: IconType; label: string; confirm?: string }>> = {
  SHIPPED: { icon: TbTruckDelivery, label: 'Mark as shipped' },
  DELIVERED: { icon: TbCircleCheck, label: 'Mark as delivered', confirm: 'Mark this order as delivered?' },
  CANCELLED: { icon: TbX, label: 'Cancel order' },
};

export function RedeemsTable() {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const router = useRouter();
  const { page, status, sourceId, code, setPage, setStatus, setSourceId, setCode } = useRedeemFilters();
  const [cancelling, setCancelling] = useState<IAdminGiftRedemptionListItem | null>(null);
  const [shipping, setShipping] = useState<{ order: IAdminGiftRedemptionListItem; mode: 'ship' | 'edit' } | null>(null);
  const [codeInput, setCodeInput] = useState(code ?? '');
  const debouncedCode = useDebounce(codeInput.trim(), 300);
  useEffect(() => {
    // Typing writes the code to the URL once the user pauses.
    if (debouncedCode !== (code ?? '')) setCode(debouncedCode || undefined);
  }, [debouncedCode, code, setCode]);
  const request = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status,
      sourceId,
      code,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    }),
    [page, status, sourceId, code],
  );
  const sources = useGetGiftSources({ limit: 100 }).data?.data?.sources ?? [];
  const { data, isLoading } = useGetAdminGiftRedemptions(request);
  const { mutateAsync, isPending } = useUpdateGiftRedemptionStatus();
  const redemptions = data?.data?.redemptions ?? [];
  const total = data?.data?.total ?? 0;

  const iconButton = cn(
    'flex size-9 cursor-pointer items-center justify-center rounded-md border transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
    isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100',
  );

  const columns: DataTableColumn<IAdminGiftRedemptionListItem>[] = useMemo(
    () => [
      {
        key: 'order',
        title: t('Order'),
        className: 'min-w-[200px]',
        render: (_, row) => (
          <div className="flex min-w-0 items-center gap-3">
            {row.gift?.mediaUrl?.startsWith('http') ? (
              // antd Image: click opens the full picture in its preview overlay.
              <span
                className="size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted [&_.ant-image]:block [&_img]:!size-10 [&_img]:object-cover"
                onClick={stopRowClick}
              >
                <Image
                  src={row.gift.mediaUrl}
                  alt={row.gift.name}
                  width={40}
                  height={40}
                  preview={{ mask: false }}
                  className="cursor-zoom-in"
                />
              </span>
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground" aria-hidden>
                <TbGift className="size-5" />
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link
                href={`/admin/gifts/orders/${row.code}`}
                className="w-fit rounded-sm font-mono text-xs font-semibold text-blue-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={t('View order {{code}}', { code: row.code })}
                onClick={stopRowClick}
              >
                {row.code}
              </Link>
              <span className={PRIMARY}>{row.gift?.name ?? t('Gift')}</span>
              <span className={cn(SECONDARY, 'tabular-nums')}>{t('{{points}} SP', { points: row.greenPointsSpent })}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'quantity',
        title: t('Qty'),
        className: 'w-[72px] text-center',
        render: (_, row) => (
          // Packers read this column; more than one item stands out.
          <span
            className={cn(
              'inline-flex min-w-8 justify-center rounded-md px-2 py-0.5 text-sm tabular-nums',
              row.quantity > 1 ? 'bg-amber-100 font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200' : 'text-foreground-secondary',
            )}
            aria-label={t('{{count}} items', { count: row.quantity })}
          >
            {row.quantity}
          </span>
        ),
      },
      {
        key: 'recipient',
        title: t('Recipient'),
        className: 'min-w-[180px]',
        render: (_, row) => {
          const recipient = row.recipientName || row.user?.name || t('Unknown user');
          return (
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={PRIMARY}>{recipient}</span>
              <span className={cn(SECONDARY, 'tabular-nums')}>{displayPhone(row.phoneNumber)}</span>
              {row.user?.name && row.user.name !== recipient ? (
                <span className={SECONDARY}>
                  {t('Account')}: {row.user.name}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'location',
        title: t('Receiving address'),
        className: 'min-w-[260px]',
        render: (_, row) => (
          <div className="max-w-[320px] space-y-0.5">
            <TooltipTruncatedText text={row.pickupLocation} maxLength={40} className={cn(PRIMARY, 'min-w-0')} />
            {row.addressDetail ? (
              <p className={SECONDARY}>{row.addressDetail}</p>
            ) : null}
            {row.deliveryNote ? (
              <p className={cn(SECONDARY, 'line-clamp-2')} title={row.deliveryNote}>
                {t('Note')}: {row.deliveryNote}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'createdAt',
        title: t('Created at'),
        className: 'min-w-[130px]',
        render: (_, row) => (
          <time dateTime={row.createdAt} className="flex flex-col gap-0.5 whitespace-nowrap">
            <span className={cn(PRIMARY, 'tabular-nums')}>{formattedDate(row.createdAt)}</span>
            <span className={cn(SECONDARY, 'tabular-nums')}>{timeOf(row.createdAt)}</span>
          </time>
        ),
      },
      {
        key: 'status',
        title: t('Status'),
        className: 'min-w-[140px]',
        render: (_, row) => (
          <div className="flex flex-col items-start gap-1">
            <Pill tone={GIFT_REDEEM_TONE[row.status]} isDark={isDark}>
              {t(row.status)}
            </Pill>
            {row.status === 'CANCELLED' ? (
              <div className={cn(SECONDARY, 'max-w-[220px] space-y-0.5')}>
                {row.cancelReason ? (
                  <p className="line-clamp-3 [overflow-wrap:anywhere]" title={row.cancelReason}>
                    {row.cancelReason}
                  </p>
                ) : null}
                <p>
                  {row.cancelledAt ? formattedDate(row.cancelledAt, true) : '—'}
                  {' · '}
                  {row.restocked === null ? '—' : row.restocked ? t('Back in stock') : t('Not back in stock')}
                </p>
              </div>
            ) : (
              <span className={cn(SECONDARY, 'tabular-nums')}>{formattedDate(row.statusUpdatedAt, true)}</span>
            )}
            {row.trackingCode ? (
              <span className={cn(SECONDARY, 'flex max-w-[220px] items-center gap-1')}>
                <span className="min-w-0">
                  {row.carrier} · <span className="font-mono">{row.trackingCode}</span>
                </span>
                {row.status === 'SHIPPED' ? (
                  <button
                    type="button"
                    className="-m-1 shrink-0 cursor-pointer rounded p-1 transition-colors hover:bg-muted hover:text-foreground"
                    onClick={(e) => {
                      stopRowClick(e);
                      setShipping({ order: row, mode: 'edit' });
                    }}
                    aria-label={t('Edit tracking')}
                    title={t('Edit tracking')}
                  >
                    <TbEdit className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'action',
        title: t('Action'),
        className: 'w-[120px]',
        render: (_, row) => {
          // Buttons come from the server's state machine only (spec 016 FR-039).
          const next = row.allowedTransitions ?? [];
          // Also catches clicks from the confirm dialog, which React bubbles through its portal.
          return (
            <div className="flex items-center gap-2" onClick={stopRowClick}>
              {next.map((nextStatus) => {
                const action = STATUS_ACTION[nextStatus];
                if (!action) return null;
                const Icon = action.icon;
                const label = t(action.label);
                if (nextStatus === 'SHIPPED') {
                  return (
                    <button
                      key={nextStatus}
                      type="button"
                      className={iconButton}
                      disabled={isPending}
                      onClick={() => setShipping({ order: row, mode: 'ship' })}
                      aria-label={label}
                      title={label}
                    >
                      <Icon className="size-5" aria-hidden />
                    </button>
                  );
                }
                if (nextStatus === 'CANCELLED') {
                  return (
                    <button
                      key={nextStatus}
                      type="button"
                      className={cn(iconButton, isDark ? 'hover:text-red-300' : 'hover:border-red-200 hover:bg-red-50 hover:text-red-600')}
                      disabled={isPending}
                      onClick={() => setCancelling(row)}
                      aria-label={label}
                      title={label}
                    >
                      <Icon className="size-5" aria-hidden />
                    </button>
                  );
                }
                return (
                  <ConfirmPopover
                    key={nextStatus}
                    theme={theme}
                    title={t(action.confirm ?? action.label)}
                    description={t('{{gift}} for {{name}}', {
                      gift: row.gift?.name ?? t('Gift'),
                      name: row.recipientName || row.user?.name || t('Unknown user'),
                    })}
                    confirmLabel={label}
                    cancelLabel={t('Cancel')}
                    confirmPending={isPending}
                    onConfirm={async () => {
                      await mutateAsync({ id: row.id, status: nextStatus }).catch(() => undefined);
                    }}
                    trigger={
                      <button type="button" className={iconButton} disabled={isPending} aria-label={label} title={label}>
                        <Icon className="size-5" aria-hidden />
                      </button>
                    }
                  />
                );
              })}
              {next.length === 0 ? <span className="text-xs text-muted-foreground">—</span> : null}
            </div>
          );
        },
      },
    ],
    [iconButton, isDark, isPending, mutateAsync, t, theme],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:w-[210px]">
          <TbSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder={t('Order code')}
            aria-label={t('Search by order code')}
            className="!h-10 !border-input pl-9 font-mono"
          />
        </div>
        <Select
          value={status ?? 'ALL'}
          onValueChange={(value) => setStatus(value === 'ALL' ? undefined : (value as GiftRedemptionStatus))}
        >
          <SelectTrigger className="!h-10 w-full !border-input sm:w-[210px]">
            <SelectValue placeholder={t('Status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All statuses')}</SelectItem>
            {REDEEM_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {t(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sourceId ?? 'ALL'}
          onValueChange={(value) => setSourceId(value === 'ALL' ? undefined : value)}
        >
          <SelectTrigger className="!h-10 w-full !border-input sm:w-[210px]" aria-label={t('Gift source')}>
            <SelectValue placeholder={t('Gift source')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All sources')}</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      </div>

      <SharedDataTable
        columns={columns}
        data={redemptions}
        loading={isLoading}
        rowKey="id"
        onRowClick={(row) => router.push(`/admin/gifts/orders/${row.code}`)}
        emptyTitle={t('No redeem orders found')}
        emptyDescription={t('Redeem orders will appear here.')}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: setPage,
        }}
      />

      <CancelRedemptionDialog order={cancelling} onClose={() => setCancelling(null)} />
      <ShipOrderDialog order={shipping?.order ?? null} mode={shipping?.mode ?? 'ship'} onClose={() => setShipping(null)} />
    </div>
  );
}
