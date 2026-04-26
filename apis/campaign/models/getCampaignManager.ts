import { IUser } from '@/apis/auth/models/user';
import { IPaginationResponse } from '@/types/PaginationResponse';

export interface IGetCampaignManagerRequest {
  campaignId: string;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface IGetCampaignManagerItem {
  id: string;
  campaign_id: string;
  user_id: string;
  status: number;
  created_at: string;
  updated_at: string;
  user: Pick<IUser, 'id' | 'name' | 'email' | 'avatar'>;
}

export interface IGetCampaignManagerResponse extends IPaginationResponse<
  IGetCampaignManagerItem[],
  'managers'
> {}
