import { IUser } from '@/apis/auth/models/user';
import { IPaginationResponse } from '@/types/PaginationResponse';

export interface IGetCampaignVolunteerRequest {
  campaignId: string;
  volunteerId?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface IGetCampaignVolunteerItem {
  id: string;
  campaign_id: string;
  user_id: string;
  status: number;
  created_at: string;
  updated_at: string;
  volunteer: Pick<IUser, 'id' | 'name' | 'email' | 'avatar'>;
}

export interface IGetCampaignVolunteerResponse extends IPaginationResponse<
  IGetCampaignVolunteerItem[],
  'volunteers'
> {}
