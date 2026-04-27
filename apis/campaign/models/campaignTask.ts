import { IPaginationResponse } from '@/types/PaginationResponse';
import { IBaseResponse } from '@/types/BaseResponse';

export interface ICampaignTask {
  id: string;
  name: string;
  description: string;
  status: number;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  scheduled_time: string;
}

export interface IGetCampaignTaskRequest {
  campaignId: string;
}

export interface IGetCampaignTaskResponse extends IPaginationResponse<ICampaignTask, 'tasks'> {}

export interface ICreateCampaignTaskRequest {
  title: string;
  description: string;
  scheduled_time: string;
}

export interface ICreateCampaignTaskResponse extends IBaseResponse<{ task: ICampaignTask }> {}

export interface IUpdateCampaignTaskRequest {
  id: string;
  title: string;
  description: string;
  scheduled_time: string;
  status: number;
}

export interface IUpdateCampaignTaskResponse extends IBaseResponse<{ task: ICampaignTask }> {}

export interface IDeleteCampaignTaskRequest {
  id: string;
}

export interface IDeleteCampaignTaskResponse extends IBaseResponse<{ task: ICampaignTask }> {}
