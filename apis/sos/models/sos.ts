import type { IBaseResponse } from '@/types/BaseResponse';

export type SosType = 'manpower' | 'hazard' | 'medical';
export type SosState = 'open' | 'helping' | 'resolved' | 'expired' | 'escalated';
export type SosRole = 'volunteer' | 'leader' | 'manager' | 'resident';
export type SosIneligibleReason =
  | 'not_logged'
  | 'no_running_shift'
  | 'not_checked_in'
  | 'email_unverified'
  | 'phone_missing'
  | 'too_far'
  | 'location_required'
  | 'shift_not_allowed';
export type SosResponderStatus = 'on_the_way' | 'arrived' | 'cancelled';
export type SosResolutionCode = 'handled' | 'false_alarm' | 'not_real';
export type SosTool = 'truck' | 'bags' | 'shovel' | 'gloves' | 'rake' | 'other';
export type SosHazardKind =
  | 'needles'
  | 'chemicals'
  | 'medical_waste'
  | 'construction_debris'
  | 'other';
export type SosConsciousness = 'conscious' | 'unconscious';

/** Per-type details; the server hides medical details from people outside the team. */
export interface ISosDetails {
  people_needed?: number | null;
  tools?: SosTool[];
  tools_note?: string | null;
  /** One or more kinds. */
  hazard_kinds?: SosHazardKind[];
  consciousness?: SosConsciousness;
  affected?: number;
}

export interface ISosEligibilityShift {
  id: string;
  name: string;
  meeting_point_id: string;
  meeting_point_name: string;
  start_at: string;
  end_at: string;
}

export interface ISosEligibility {
  can_raise: boolean;
  role: SosRole | null;
  reason: SosIneligibleReason | null;
  shifts: ISosEligibilityShift[];
  /** null: no hourly limit (SOS_MAX_PER_HOUR off). */
  hourly_remaining: number | null;
}

export interface ISosEligibilityRequest {
  campaign_id: string;
  latitude?: number;
  longitude?: number;
}

export type IGetSosEligibilityResponse = IBaseResponse<ISosEligibility>;

export interface ISosSummary {
  id: number;
  campaign_id: string;
  type: SosType;
  state: SosState;
  latitude: number;
  longitude: number;
  created_at: string;
  people_needed: number | null;
  on_the_way_count: number;
  arrived_count: number;
  is_mine: boolean;
  my_response: 'on_the_way' | 'arrived' | null;
  /** Not in the agreed contract; used when the server sends it (hazard banner of a shift). */
  meeting_point_id?: string | null;
}

export interface ISosResponder {
  user_id: string;
  name: string | null;
  avatar: string | null;
  status: SosResponderStatus;
  updated_at: string;
}

export interface ISosPermissions {
  can_respond: boolean;
  can_cancel_response: boolean;
  can_update_location: boolean;
  can_resolve: boolean;
}

export interface ISosDetail extends ISosSummary {
  campaign: {
    id: string;
    title: string;
    contact_name: string | null;
    contact_phone: string | null;
    safety_notes: string | null;
  };
  shift: { id: string; name: string; start_at: string; end_at: string } | null;
  meeting_point: { id: string; name: string; latitude: number; longitude: number } | null;
  reporter_role: SosRole;
  details: ISosDetails | null;
  description: string | null;
  photo_urls: string[];
  phone: string | null;
  reporter: { id: string; name: string; avatar: string | null } | null;
  responders: ISosResponder[];
  expires_at: string | null;
  escalated_at: string | null;
  radius_km: number;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_code: SosResolutionCode | null;
  resolution_note: string | null;
  location_updated_at: string | null;
  permissions: ISosPermissions;
  viewer_is_team: boolean;
}

export type ISosDetailResponse = IBaseResponse<ISosDetail>;

export interface ICreateSosRequest {
  campaign_id: string;
  shift_id?: string;
  type: SosType;
  details: ISosDetails;
  description?: string;
  photo_urls?: string[];
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface ISosDuplicatesRequest {
  campaign_id: string;
  type: SosType;
  latitude: number;
  longitude: number;
}

export type ISosDuplicatesResponse = IBaseResponse<ISosSummary[]>;

export interface ISosListRequest {
  campaign_id?: string;
  /** Comma-separated states, e.g. `open,helping,escalated`. */
  states?: string;
  latitude?: number;
  longitude?: number;
  max_distance?: number;
  page?: number;
  limit?: number;
}

export type ISosListResponse = IBaseResponse<{ items: ISosSummary[]; total: number }>;

export interface ISosLocationRequest {
  id: number;
  latitude: number;
  longitude: number;
}

export interface IResolveSosRequest {
  id: number;
  code: SosResolutionCode;
  note?: string;
}

export interface ISosAvailabilityWindow {
  /** 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** `HH:mm` */
  from: string;
  to: string;
}

export interface ISosAvailability {
  enabled: boolean;
  /** Empty = available at any time. */
  schedule: ISosAvailabilityWindow[];
  location_updated_at: string | null;
}

export type ISosAvailabilityResponse = IBaseResponse<ISosAvailability>;

export interface IUpdateSosAvailabilityRequest {
  enabled: boolean;
  schedule: ISosAvailabilityWindow[];
}

export interface IUpdateSosAvailabilityLocationRequest {
  latitude: number;
  longitude: number;
}
