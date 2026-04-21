import { IBaseResponse } from "@/types/BaseResponse";
import { ICampaign } from "./campaign";

export interface ICreateCampaignRequest {
  organization_id?: string;
  title: string;
  description: string;
  difficulty?: number;
  green_points?: number;
  report_ids?: string[]; // list of report ids
}

export interface ICreateCampaignResponse extends IBaseResponse<{
  campaign: ICampaign;
}> {}