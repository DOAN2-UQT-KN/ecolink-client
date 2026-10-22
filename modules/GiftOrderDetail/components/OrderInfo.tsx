import { memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Gift, MapPin, ReceiptText, Truck, type LucideIcon } from 'lucide-react';
import { TbCoinFilled } from 'react-icons/tb';
import { Image } from 'antd';

import type { IGiftRedemptionDetail } from '@/apis/gift/models/gift';
import { CopyButton } from '@/components/ui/CopyButton';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { formattedDate } from '@/utils/formattedDate';
import { displayPhone } from '@/utils/phone';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-foreground-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/** A titled card holding one group of facts. */
function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border p-4" aria-label={title}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-foreground-secondary" aria-hidden />
        {title}
      </h3>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}

type OrderInfoProps = { order: IGiftRedemptionDetail; adminExtra?: ReactNode };

/**
 * The gift with its price breakdown and the order facts beside it, then delivery and shipping side by
 * side; one column on phones.
 */
export const OrderInfo = memo(function OrderInfo({ order, adminExtra }: OrderInfoProps) {
  const { t } = useTranslation();
  const { title, description } = useLocalizedDisplay();
  const gift = order.gift;
  const name = gift ? title(gift) || gift.name : t('Gift');
  const about = gift ? description(gift) || gift.description : '';
  const hasPin = order.deliveryLatitude != null && order.deliveryLongitude != null;
  const points = (n: number) => t('{{points}} SP', { points: n });

  return (
    <div className="space-y-4">
      {order.status === 'CANCELLED' && order.cancelReason ? (
        <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 [overflow-wrap:anywhere] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <span className="font-medium">{t('Cancel reason')}:</span> {order.cancelReason}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-border p-4 lg:col-span-2" aria-label={t('Gift')}>
          <div className="flex gap-4">
            {gift?.mediaUrl?.startsWith('http') ? (
              <span className="size-20 shrink-0 overflow-hidden rounded-lg border border-border sm:size-24 [&_.ant-image]:block [&_img]:!size-20 sm:[&_img]:!size-24 [&_img]:object-cover">
                <Image src={gift.mediaUrl} alt={name} width={96} height={96} preview={{ mask: false }} className="cursor-zoom-in" />
              </span>
            ) : (
              <span className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground-secondary sm:size-24" aria-hidden>
                <Gift className="size-8" />
              </span>
            )}
            <div className="min-w-0 space-y-1">
              <h3 className="font-display-3 font-semibold text-foreground [overflow-wrap:anywhere]">{name}</h3>
              {about ? <p className="line-clamp-3 text-sm text-foreground-secondary">{about}</p> : null}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 divide-x divide-border rounded-md bg-muted/50 text-center">
            <div className="px-2 py-2.5">
              <dt className="text-xs text-foreground-secondary">{t('Unit price')}</dt>
              <dd className="mt-0.5 text-sm tabular-nums text-foreground">{points(order.unitPoints)}</dd>
            </div>
            <div className="px-2 py-2.5">
              <dt className="text-xs text-foreground-secondary">{t('Quantity')}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">× {order.quantity}</dd>
            </div>
            <div className="px-2 py-2.5">
              <dt className="text-xs text-foreground-secondary">{t('Total')}</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-button-accent">
                <TbCoinFilled className="size-4 text-yellow-500" aria-hidden />
                {points(order.greenPointsSpent)}
              </dd>
            </div>
          </dl>
        </section>

        <Section icon={ReceiptText} title={t('Order')}>
          <Row label={t('Order code')}>
            <span className="inline-flex items-center gap-1">
              <span className="font-mono font-semibold">{order.code}</span>
              <CopyButton value={order.code} label={t('Copy order code')} className="-my-1.5" />
            </span>
          </Row>
          <Row label={t('Created at')}>
            <time dateTime={order.createdAt}>{formattedDate(order.createdAt, true)}</time>
          </Row>
          {adminExtra}
        </Section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={MapPin} title={t('Delivery')}>
          {order.recipientName ? <Row label={t('Recipient')}>{order.recipientName}</Row> : null}
          <Row label={t('Phone')}>
            <span className="tabular-nums">{displayPhone(order.phoneNumber)}</span>
          </Row>
          <Row label={t('Receiving address')}>
            <span className="inline-flex items-start gap-1">
              <span className="min-w-0">{order.pickupLocation}</span>
              {hasPin ? (
                <a
                  href={`https://www.google.com/maps?q=${order.deliveryLatitude},${order.deliveryLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-my-0.5 shrink-0 rounded p-0.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={t('View on map')}
                  title={t('View on map')}
                >
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              ) : null}
            </span>
            {order.addressDetail ? <span className="block text-xs text-foreground-secondary">{order.addressDetail}</span> : null}
          </Row>
          {order.deliveryNote ? <Row label={t('Note')}>{order.deliveryNote}</Row> : null}
        </Section>

        <Section icon={Truck} title={t('Shipping')}>
          {order.trackingCode ? (
            <>
              <Row label={t('Carrier')}>{order.carrier}</Row>
              <Row label={t('Tracking code')}>
                <span className="inline-flex items-center gap-1">
                  <span className="font-mono">{order.trackingCode}</span>
                  <CopyButton value={order.trackingCode} label={t('Copy tracking code')} className="-my-1.5" />
                </span>
              </Row>
              {order.shippedAt ? (
                <Row label={t('Shipped at')}>
                  <time dateTime={order.shippedAt}>{formattedDate(order.shippedAt, true)}</time>
                </Row>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-foreground-secondary">{t('Not shipped yet')}</p>
          )}
        </Section>
      </div>
    </div>
  );
});
