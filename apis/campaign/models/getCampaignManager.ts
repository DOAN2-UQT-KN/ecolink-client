import { IBaseResponse } from '@/types/BaseResponse';
import { IPaginationResponse } from '@/types/PaginationResponse';

export interface IGetCampaignManagerRequest {
  campaignId: string;
  userId?: string;
  page?: number;
  limit?: number;
  /** Query params are not case-converted server-side, so they stay camelCase. */
  sortBy?: 'assignedAt' | 'userId' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface IGetCampaignManagerItem {
  campaign_id: string;
  user_id: string;
  /** Display name from identity-service; empty string when not found. */
  name: string | null;
  avatar: string | null;
  assigned_by: string | null;
  assigned_at: string;
}

export type IGetCampaignManagerResponse = IPaginationResponse<IGetCampaignManagerItem[], 'managers'>;

export interface IAddCampaignManagersRequest {
  campaignId: string;
  user_ids: string[];
}

export interface IRemoveCampaignManagerRequest {
  campaignId: string;
  user_id: string;
}

export type IAddCampaignManagersResponse = IBaseResponse<unknown>;
export type IRemoveCampaignManagerResponse = IBaseResponse<unknown>;
