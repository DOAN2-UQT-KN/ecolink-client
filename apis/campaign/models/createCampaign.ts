import { IBaseResponse } from "@/types/BaseResponse";
import { ICampaign } from "./campaign";
import type { ICampaignRequirements, IMeetingPoint } from "./lifecycle";

export interface ICreateCampaignRequest {
  organization_id: string;
  title: string;
  description?: string;
  difficulty: number;
  report_ids?: string[];
  start_date?: string;
  end_date?: string;
  latitude?: number;
  longitude?: number;
  detail_address?: string;
  banner?: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  safety_notes?: string | null;
  requirements?: ICampaignRequirements | null;
  meeting_points?: IMeetingPoint[];
}

/** Body of PUT /api/v1/campaigns/:id; the status never changes here. */
export type IUpdateCampaignRequest = Partial<Omit<ICreateCampaignRequest, "organization_id">>;

export interface ICreateCampaignResponse extends IBaseResponse<{
  campaign: ICampaign;
}> {}
