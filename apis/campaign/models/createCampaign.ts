import { IBaseResponse } from "@/types/BaseResponse";
import { ICampaign } from "./campaign";

export interface ICreateCampaignRequest {
  organization_id?: string;
  title: string;
  description: string;
  difficulty?: number;
  green_points?: number;
  report_ids?: string[]; // list of report ids'
  start_date?: string;
  end_date?: string;
  latitude?: number;
  longitude?: number;
  detail_address?: string;
}

export interface ICreateCampaignResponse extends IBaseResponse<{
  campaign: ICampaign;
}> {}