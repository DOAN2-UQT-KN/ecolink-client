import { IBaseResponse } from "@/types/BaseResponse";
import type { IOrganizationOwner } from "@/apis/organization/models/organization";

export interface IShiftConflict {
  campaign_id: string;
  campaign_title: string;
  shift_id: string;
  start_at: string;
  end_at: string;
}

export interface IRegistrationOptionShift {
  id: string;
  day_id: string;
  meeting_point_id: string;
  meeting_point_name: string | null;
  meeting_point_address: string | null;
  start_at: string;
  end_at: string;
  gather_at: string | null;
  min_volunteers: number;
  max_volunteers: number | null;
  registered_count: number;
  /** Volunteers still missing to reach the minimum. */
  short_by: number;
  over_max: boolean;
  registered_by_me: boolean;
  /** The viewer's shifts in other campaigns that overlap this one. */
  conflicts: IShiftConflict[];
}

export interface IRegistrationOptions {
  registrable: boolean;
  reason: "STATUS" | "NO_SHIFT" | null;
  requirements: { min_age?: number | null; skills?: string[]; bring_own_tools?: boolean } | null;
  safety_notes: string | null;
  days: { id: string; start_at: string; end_at: string }[];
  /** Open shifts, plus the ones the viewer holds. */
  shifts: IRegistrationOptionShift[];
}

export type IGetRegistrationOptionsResponse = IBaseResponse<IRegistrationOptions>;

export interface IUpdateMyRegistrationsRequest {
  campaign_id: string;
  shift_ids: string[];
  accept_conditions?: boolean;
}

export type RegistrationWarning = "OVERLAP" | "OVER_MAX";

export type IUpdateMyRegistrationsResponse = IBaseResponse<{
  shift_ids: string[];
  added: string[];
  left: string[];
  warnings: RegistrationWarning[];
}>;

export interface IRegisteredVolunteer {
  user_id: string;
  volunteer: IOrganizationOwner;
  registered_at: string;
  checked_in_at: string | null;
}

export interface IShiftRegistrations {
  shift_id: string;
  day_id: string;
  meeting_point_id: string;
  meeting_point_name: string | null;
  start_at: string;
  end_at: string;
  min_volunteers: number;
  max_volunteers: number | null;
  registered_count: number;
  volunteers: IRegisteredVolunteer[];
}

export type IGetCampaignRegistrationsResponse = IBaseResponse<{
  shifts: IShiftRegistrations[];
  /** When managers may invite nearby residents again; null when they may now. */
  next_invite_at: string | null;
}>;

export type IInviteNearbyResponse = IBaseResponse<{ invited: number }>;
export type ICloseShiftResponse = IBaseResponse<{ notified: number }>;
