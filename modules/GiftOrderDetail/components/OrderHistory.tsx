import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { IGiftRedemptionEvent } from '@/apis/gift/models/gift';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';
import { actorLabel, describeEvent } from '../services/orderEvent.service';
import type { OrderAudience } from '../types/GiftOrderDetail.types';

const DOT: Record<IGiftRedemptionEvent['type'], string> = {
  CREATED: 'bg-zinc-400',
  SHIPPED: 'bg-blue-500',
  TRACKING_UPDATED: 'bg-amber-500',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
};

type OrderHistoryProps = { events: IGiftRedemptionEvent[]; audience: OrderAudience };

/** Timeline of everything that happened to the order, newest first. */
export const OrderHistory = memo(function OrderHistory({ events, audience }: OrderHistoryProps) {
  const { t } = useTranslation();
  const hasRebuilt = events.some((e) => e.reconstructed);

  return (
    <div className="space-y-3">
      {hasRebuilt ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t('Data before this feature was released may be incomplete.')}
        </p>
      ) : null}
      <ol className="relative space-y-4 border-l border-border pl-5">
        {events.map((event) => {
          const { title, detail } = describeEvent(event, t);
          return (
            <li key={event.id} className="relative">
              <span
                className={cn('absolute -left-[26px] top-1.5 size-2.5 rounded-full ring-4 ring-card', DOT[event.type])}
                aria-hidden
              />
              <p className="text-sm font-medium text-foreground">{title}</p>
              {detail ? <p className="text-sm text-foreground-secondary [overflow-wrap:anywhere]">{detail}</p> : null}
              <p className="mt-0.5 text-xs text-foreground-secondary">
                {actorLabel(event, audience, t)} ·{' '}
                <time dateTime={event.createdAt} className="tabular-nums">
                  {formattedDate(event.createdAt, true)}
                </time>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
});
