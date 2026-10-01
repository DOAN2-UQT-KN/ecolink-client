import { IBaseResponse } from "@/types/BaseResponse";
import { ICampaign } from "./campaign";
import type {
  ICampaignDayInput,
  ICampaignRequirements,
  ICampaignShiftInput,
  IMeetingPoint,
} from "./lifecycle";

export interface ICreateCampaignRequest {
  organization_id: string;
  title: string;
  description?: string;
  difficulty: number;
  banner?: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  safety_notes?: string | null;
  requirements?: ICampaignRequirements | null;
  min_volunteers_reason?: string | null;
  days?: ICampaignDayInput[];
  meeting_points?: IMeetingPoint[];
  shifts?: ICampaignShiftInput[];
}

/** Body of PUT /api/v1/campaigns/:id; the status never changes here. */
export type IUpdateCampaignRequest = Partial<Omit<ICreateCampaignRequest, "organization_id">>;

export interface ICreateCampaignResponse extends IBaseResponse<{
  campaign: ICampaign;
}> {}
