import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Gift } from 'lucide-react';
import { TbCoinFilled } from 'react-icons/tb';

import type { IGiftRedemptionListItem } from '@/apis/gift/models/gift';
import { Image } from 'antd';
import { Pill } from '@/components/ui/Pill';
import { Link, useRouter } from '@/libs/router';
import { CancelOrderDialog } from './CancelOrderDialog';
import { ConfirmDeliveryButton } from './ConfirmDeliveryButton';
import { GIFT_REDEEM_TONE } from '@/constants/statusTone';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { formattedDate } from '@/utils/formattedDate';

/** Controls inside the card keep their own click; everything else opens the order. */
const OWN_CLICK = 'a, button, input, textarea, label, .ant-image';

/** One gift order in the user's history: what, when, its status. Delivery details live on the order page. */
export function OrderCard({ order }: { order: IGiftRedemptionListItem }) {
  const { t } = useTranslation();
  const router = useRouter();
  const openOrder = (e: MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    // Dialogs and image previews render in portals: their clicks bubble here but are not inside the card.
    if (!e.currentTarget.contains(target) || target.closest(OWN_CLICK)) return;
    router.push(`/profile/orders/${order.code}`);
  };
  const { title } = useLocalizedDisplay();
  const name = order.gift ? title(order.gift) || order.gift.name : t('Gift');

  return (
    <article
      className="cursor-pointer overflow-hidden rounded-xl border border-[rgba(136,122,71,0.3)] bg-white shadow-sm transition-shadow hover:shadow-md"
      onClick={openOrder}
    >
      <header className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-start gap-3">
          {order.gift?.mediaUrl?.startsWith('http') ? (
            // antd Image: tapping opens the full picture in its preview overlay.
            <span className="size-14 shrink-0 overflow-hidden rounded-lg border border-[rgba(136,122,71,0.2)] bg-[#edf3e6] [&_.ant-image]:block [&_img]:!size-14 [&_img]:object-cover">
              <Image src={order.gift.mediaUrl} alt={name} width={56} height={56} preview={{ mask: false }} className="cursor-zoom-in" />
            </span>
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[#edf3e6] text-button-accent" aria-hidden>
              <Gift className="size-6" />
            </span>
          )}
          <div className="min-w-0">
            <Link
              href={`/profile/orders/${order.code}`}
              className="w-fit rounded-sm font-mono text-xs font-semibold text-button-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent"
              aria-label={t('View order {{code}}', { code: order.code })}
            >
              {order.code}
            </Link>
            <h3 className="font-display-3 font-semibold text-foreground [overflow-wrap:anywhere]">
              {name} <span className="font-normal tabular-nums text-foreground-secondary">× {order.quantity}</span>
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-foreground-secondary">
              <span className="inline-flex items-center gap-1 font-medium text-button-accent">
                <TbCoinFilled className="size-3.5 text-yellow-500" aria-hidden />
                <span className="tabular-nums">{t('{{points}} SP', { points: order.greenPointsSpent })}</span>
              </span>
              <span aria-hidden>·</span>
              <time dateTime={order.createdAt}>{formattedDate(order.createdAt, true)}</time>
            </p>
          </div>
        </div>
        <Pill tone={GIFT_REDEEM_TONE[order.status]} className="shrink-0">
          {t(order.status)}
        </Pill>
      </header>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(136,122,71,0.15)] bg-[#fbfaf5] px-4 py-2 text-xs text-foreground-secondary">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          {t('Last updated')}: <time dateTime={order.statusUpdatedAt}>{formattedDate(order.statusUpdatedAt, true)}</time>
        </span>
        {/* Actions come from the server: cancel before shipping, confirm after (spec 017). */}
        {order.allowedTransitions.length > 0 ? (
          <span className="flex gap-2">
            {order.allowedTransitions.includes('CANCELLED') ? <CancelOrderDialog code={order.code} /> : null}
            {order.allowedTransitions.includes('DELIVERED') ? <ConfirmDeliveryButton code={order.code} /> : null}
          </span>
        ) : null}
      </footer>
    </article>
  );
}
