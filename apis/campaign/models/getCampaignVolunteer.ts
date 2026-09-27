import { IUser } from '@/apis/auth/models/user';
import { IPaginationResponse } from '@/types/PaginationResponse';

export interface IGetCampaignVolunteerRequest {
  campaignId: string;
  volunteerId?: string;
  page?: number;
  limit?: number;
  /** Query params are not case-converted server-side, so they stay camelCase. */
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface IGetCampaignVolunteerItem {
  id: string;
  campaign_id: string;
  volunteer_id?: string;
  user_id?: string;
  status: number;
  created_at: string;
  updated_at: string;
  volunteer: Pick<IUser, 'id' | 'name' | 'avatar'>;
  /** ISO datetime when volunteer checked in via QR; absent if not yet. */
  checked_in_at?: string | null;
}

export type IGetCampaignVolunteerResponse = IPaginationResponse<IGetCampaignVolunteerItem[], 'volunteers'>;
