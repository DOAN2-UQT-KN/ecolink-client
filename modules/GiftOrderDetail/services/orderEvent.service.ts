import type { TFunction } from 'i18next';
import type { IGiftRedemptionEvent } from '@/apis/gift/models/gift';
import type { OrderAudience } from '../types/GiftOrderDetail.types';

const TITLE: Record<IGiftRedemptionEvent['type'], string> = {
  CREATED: 'Order placed',
  SHIPPED: 'Shipped',
  TRACKING_UPDATED: 'Tracking updated',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const tracking = (carrier?: string | null, code?: string | null) =>
  [carrier, code].filter(Boolean).join(' · ');

/** Title and one line of detail for a history entry. */
export function describeEvent(event: IGiftRedemptionEvent, t: TFunction): { title: string; detail?: string } {
  const data = event.data ?? {};
  switch (event.type) {
    case 'CREATED':
      return {
        title: t(TITLE.CREATED),
        detail:
          data.quantity == null
            ? undefined
            : data.quantity === 1
              ? t('1 item')
              : t('{{count}} items', { count: data.quantity }),
      };
    case 'SHIPPED':
      return { title: t(TITLE.SHIPPED), detail: tracking(data.carrier, data.trackingCode) || undefined };
    case 'TRACKING_UPDATED':
      return {
        title: t(TITLE.TRACKING_UPDATED),
        detail: `${tracking(data.previousCarrier, data.previousTrackingCode) || '—'} → ${tracking(data.carrier, data.trackingCode)}`,
      };
    case 'CANCELLED': {
      const restock =
        data.restocked == null
          ? null
          : !data.restocked
            ? t('Not returned to stock')
            : data.returnedQuantity
              ? t('Returned to stock ({{count}})', { count: data.returnedQuantity })
              : t('Returned to stock');
      const detail = [data.cancelReason, restock].filter(Boolean).join(' · ');
      return { title: t(TITLE.CANCELLED), detail: detail || undefined };
    }
    default:
      return { title: t(TITLE[event.type]) };
  }
}

/** "Customer" / "Admin"; admins also see which admin, when known. */
export function actorLabel(event: IGiftRedemptionEvent, audience: OrderAudience, t: TFunction): string {
  if (event.actorRole === 'USER') return t('Customer');
  const name = audience === 'admin' ? event.actor?.name : null;
  return name ? `${t('Admin')} · ${name}` : t('Admin');
}
