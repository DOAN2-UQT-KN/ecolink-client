import type { IUser } from '@/apis/auth/models/user';
import { IBaseResponse } from '@/types/BaseResponse';
import { IPaginationResponse } from '@/types/PaginationResponse';

export interface IJoinRequest {
  id: string;
  campaign_id: string;
  user_id: string;
  status: number;
  created_at: string;
  updated_at: string;
  volunteer?: Pick<IUser, 'id' | 'name' | 'email' | 'avatar'>;
}

export interface IJoinCampaignRequest {
  campaign_id: string;
}

export interface IJoinCampaignResponse extends IBaseResponse<IJoinRequest> {}

export interface IGetJoinCampaignRequest {
  campaignId: string;
  status?: number;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

/** Query params for GET /volunteers/join-requests/my */
export interface IGetMyJoinCampaignRequest {
  campaign_id?: string;
  status?: number;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface ICancelJoinCampaignRequest {
  requestId: string;
}

export interface ICancelJoinCampaignResponse extends IBaseResponse<unknown> {}

export type IGetJoinCampaignResponse = IPaginationResponse<IJoinRequest[], 'join_requests'>;

export interface IProcessJoinCampaignRequest {
  request_id: string;
  approved: boolean;
}

export interface IProcessJoinCampaignResponse extends IBaseResponse<unknown> {}
