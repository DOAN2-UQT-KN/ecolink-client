import { IBaseResponse } from "@/types/BaseResponse";
import { ICampaign } from "./campaign";

/** Optional participation conditions set by the campaign creator. */
export interface ICampaignRequirements {
  min_age?: number | null;
  skills?: string[];
  bring_own_tools?: boolean;
}

/** A gathering point of a campaign (1–5); each waste point belongs to exactly one. */
export interface IMeetingPoint {
  id?: string;
  name?: string | null;
  latitude: number;
  longitude: number;
  detail_address?: string | null;
  radius_km: number;
  sort_order?: number;
  report_ids: string[];
}

/** One day of a campaign (1–7, within 14 days of the first). */
export interface ICampaignDay {
  id: string;
  start_at: string;
  end_at: string;
  sort_order: number;
}

/**
 * A shift's status (spec 4.2), derived on the server: off (turned off), upcoming, running,
 * awaiting_result (past its end, no result yet), ended (with its result).
 */
export type ShiftStatus = 'upcoming' | 'running' | 'awaiting_result' | 'ended' | 'off';

/**
 * One day × meeting point. `min_volunteers` 0 = the shift is off. Both numbers only drive
 * warnings; they never cap sign-ups.
 */
export interface ICampaignShift {
  id: string;
  day_id: string;
  meeting_point_id: string;
  start_at: string;
  end_at: string;
  gather_at: string | null;
  min_volunteers: number;
  /** Expected maximum; optional. */
  max_volunteers: number | null;
  leader_user_id: string | null;
  /** Actual end when the shift was ended early (spec 4.2). */
  ended_at?: string | null;
  status?: ShiftStatus;
  /** Live registrations; on the campaign detail only. */
  registered_count?: number;
}

/** Request body forms: days and shifts by position. */
export interface ICampaignDayInput {
  /** An existing day; edits of an approved campaign match days by id (spec 3.5). */
  id?: string;
  start_at: string;
  end_at: string;
}

export interface ICampaignShiftInput {
  day_index: number;
  meeting_point_index: number;
  /** Omitted or null = the day's hours. */
  start_at?: string | null;
  end_at?: string | null;
  gather_at?: string | null;
  min_volunteers: number;
  max_volunteers?: number | null;
  leader_user_id?: string | null;
}

export type CampaignCreateBlockReason =
  | "NO_PERMISSION"
  | "ORG_LOCKED"
  | "REVIEW_QUEUE_FULL"
  | "UNVERIFIED_OPEN_LIMIT";

export interface ICampaignCreateEligibility {
  organization_id: string;
  can_create: boolean;
  /** Hide the create button altogether (org admins and plain members). */
  hidden: boolean;
  reasons: CampaignCreateBlockReason[];
  is_verified: boolean;
  /** Highest difficulty allowed; null = any. */
  max_difficulty: number | null;
  open_count: number;
  open_limit: number | null;
  review_queue_count: number;
  review_queue_limit: number;
}

export type IGetCreateEligibilityResponse = IBaseResponse<{
  eligibility: ICampaignCreateEligibility;
}>;

/** One problem found when sending a campaign for review; `field` is a camelCase path. */
export interface ICampaignValidationIssue {
  field: string;
  code: string;
  message: string;
}

export type CampaignReviewDecision = "approve" | "request_revision" | "block";

export interface IReviewCampaignRequest {
  id: string;
  decision: CampaignReviewDecision;
  reason?: string | null;
}

export type ICampaignMutationResponse = IBaseResponse<{ campaign: ICampaign }>;

export interface ICampaignHistoryEntry {
  id: string;
  type: "STATUS_CHANGE" | "EDIT";
  event: string;
  from_status: number | null;
  to_status: number | null;
  actor_id: string | null;
  actor_role: "manager" | "admin" | "system";
  reason: string | null;
  /** `{ field: { from, to } }` for edits and resubmissions. */
  changes: Record<string, { from: unknown; to: unknown }> | null;
  created_at: string;
}

export type IGetCampaignHistoryResponse = IBaseResponse<{
  history: ICampaignHistoryEntry[];
}>;
