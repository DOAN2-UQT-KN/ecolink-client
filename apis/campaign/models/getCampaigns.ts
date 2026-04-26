import { ICampaign } from "./campaign";
import { IPaginationResponse } from "@/types/PaginationResponse";

export interface IGetCampaignsRequest {
  search?: string;
  status?: number;
  organization_id?: string;
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  difficulty?: number;
  start_date?: string;
  end_date?: string;
}


export type IGetCampaignsResponse = IPaginationResponse<ICampaign[], "campaigns">;
