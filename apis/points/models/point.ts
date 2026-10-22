import { ICampaign } from '@/apis/campaign/models/campaign';

export interface IPoint {
  /** Points left in unexpired lots — what can be spent on gifts */
  balance: number;
  /** Lifetime earnings; redemptions, expiry and refunds do not change it */
  earnedTotal: number;
  /** Points expiring within 7 days and the earliest expiry date (ISO) */
  expiringSoon: { amount: number; earliestAt: string | null };
}

export interface IPointTransaction {
  id?: string;
  user_id?: string;
  type?: string;
  resource_id?: string;
  resourceType?: string;
  points?: number;
  createdAt?: string;
  updatedAt?: string;
  resource?: ICampaign;
}
