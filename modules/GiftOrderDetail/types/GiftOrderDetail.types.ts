import type { ReactNode } from 'react';
import type { IGiftRedemptionDetail } from '@/apis/gift/models/gift';

/** Who is looking: the customer never sees which admin did what (spec 017 FR-041). */
export type OrderAudience = 'user' | 'admin';

export type GiftOrderDetailProps = {
  order: IGiftRedemptionDetail;
  audience: OrderAudience;
  /** Buttons valid for the current status, built by the page (each side has its own). */
  actions?: ReactNode;
  /** Admin-only rows such as the ordering account and the gift source. */
  adminExtra?: ReactNode;
  isDark?: boolean;
};
