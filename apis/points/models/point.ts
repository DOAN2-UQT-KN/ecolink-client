import { ICampaign } from '@/apis/campaign/models/campaign';

export interface IPoint {
  balance?: number;
  green_points?: number;
}

export interface IPointTransaction {
  id?: string;
  user_id?: string;
  type?: string;
  resource_id?: string;
  resource_type?: string;
  points?: number;
  created_at?: string;
  updated_at?: string;
  resource?: ICampaign;
}
