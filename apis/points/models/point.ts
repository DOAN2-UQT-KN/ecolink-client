import { ICampaign } from '@/apis/campaign/models/campaign';

export interface IPoint {
  /** SP wallet — use for gift redemption */
  spendablePoints?: number;
  spendable_points?: number;
  /** Current green points balance */
  greenPoints?: number;
  green_points?: number;
  /** Lifetime green points earned */
  greenPointsEarnedTotal?: number;
  green_points_earned_total?: number;
  /** @deprecated Prefer spendablePoints */
  balance?: number;
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
