import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { ILayer1 } from './shiftResult';

const base = '/api/v1/campaigns';

/**
 * Result verification of a campaign marked done, per meeting point: each trash point declared
 * cleaned is graded from its photos (Layer 1); the meeting point gets the worst of them, and is
 * confirmed by the reporters of its trash points (Layer 2) and voted on by residents (Layer 3).
 */
export type MeetingPointStatus = 'voting' | 'verified' | 'flagged' | 'rejected';
export type MeetingPointDecisionCode = 'score' | 'layer1_pass' | 'layer1_fail' | 'flag_timeout' | 'admin';
export type MeetingPointVoteValue = 'up' | 'down';
export type MeetingPointWeightReason =
  | 'reporter'
  | 'on_site'
  | 'nearby'
  | 'zero_new_account'
  | 'zero_unverified'
  | 'zero_far';
export type MeetingPointCannotVote = 'closed' | 'org_member' | 'campaign_manager' | 'volunteer';
export type AwaitingAdminReason = 'rejection_limit' | 'no_cleaned_points';
/** How the submission declared a trash point; only `cleaned` ones are voted on. */
export type VerificationTrashPointStatus = 'cleaned' | 'partial' | 'unhandled';

export interface IMeetingPointMyVote {
  value: MeetingPointVoteValue;
  weight: number;
  weight_reason: MeetingPointWeightReason;
  note: string | null;
  photo_url: string | null;
  /** A "not clean" vote names the trash points that are not clean. */
  flagged_report_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface IMeetingPointVote extends IMeetingPointMyVote {
  user_id: string;
  user: { id: string; name: string; avatar: string | null } | null;
  distance_m: number | null;
}

/** A trash point linked to the meeting point, with its photos of the round. */
export interface IVerificationTrashPoint {
  report_id: string;
  report: {
    title: string | null;
    detail_address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  status: VerificationTrashPointStatus;
  before_urls: string[];
  after_urls: string[];
  /** null for partial / unhandled trash points (not in the round). */
  layer1: ILayer1 | null;
  /** The viewer reported this trash point. */
  is_mine: boolean;
}

export interface IMeetingPointView {
  verification_id: string;
  meeting_point_id: string;
  /** null: shown as "Meeting point #n". */
  name: string | null;
  detail_address: string | null;
  latitude: number | null;
  longitude: number | null;
  round: number;
  status: MeetingPointStatus;
  /** The worst Layer 1 of its cleaned trash points. */
  layer1_level: ILayer1['level'];
  /** The viewer's own first, then cleaned, then the others. */
  trash_points: IVerificationTrashPoint[];
  window_ends_at: string;
  flagged_at: string | null;
  flag_deadline: string | null;
  decided_at: string | null;
  decision_code: MeetingPointDecisionCode | null;
  decision_reason: string | null;
  /** The trash points that did not pass, once rejected. */
  failed_report_ids: string[];
  up_count: number;
  down_count: number;
  /** The viewer reported a trash point of this meeting point: their vote weighs 10. */
  is_reporter: boolean;
  my_vote: IMeetingPointMyVote | null;
  can_vote: boolean;
  cannot_vote_reason: MeetingPointCannotVote | null;
  /** Admins and the campaign's managers only. */
  score: number | null;
  votes: IMeetingPointVote[] | null;
}

/** GET /campaigns/:id/verification. */
export interface ICampaignVerification {
  campaign_id: string;
  campaign_status: number;
  completion_submitted_at: string | null;
  awaiting_admin: boolean;
  awaiting_admin_reason: AwaitingAdminReason | null;
  rejection_count: number;
  max_rejections: number;
  can_see_votes: boolean;
  /** Platform admin: may decide flagged meeting points. */
  can_decide: boolean;
  cannot_vote_reason: MeetingPointCannotVote | null;
  /** Ordered like the campaign's meeting points; only those with a cleaned trash point. */
  meeting_points: IMeetingPointView[];
}

export const useCampaignVerification = (
  campaignId: string,
  options?: Omit<UseGetOptions<IBaseResponse<ICampaignVerification>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['campaign-verification', campaignId],
    queryFn: () => requestApi.get<IBaseResponse<ICampaignVerification>>(`${base}/${campaignId}/verification`),
    ...options,
  });

export type VoteMeetingPointParams = {
  campaign_id: string;
  meeting_point_id: string;
  value: MeetingPointVoteValue;
  /** A "not clean" vote needs a note or a photo… */
  note?: string;
  photo_url?: string;
  /** …and at least one of the round's cleaned trash points that is not clean. */
  report_ids?: string[];
  /** Omitted when the browser gives no position: the vote counts as seen online. */
  latitude?: number;
  longitude?: number;
  accuracy?: number;
};

type MeetingPointDecisionResponse = IBaseResponse<{ meeting_point: IMeetingPointView; campaign_status: number }>;

export const useVoteMeetingPoint = (
  options?: UsePostOptions<MeetingPointDecisionResponse, VoteMeetingPointParams>,
) =>
  usePost({
    mutationFn: ({ campaign_id, meeting_point_id, ...body }: VoteMeetingPointParams) =>
      requestApi.put<MeetingPointDecisionResponse>(
        `${base}/${campaign_id}/verification/${meeting_point_id}/vote`,
        body,
      ),
    queryKey: ['campaign-verification'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

export type UnvoteMeetingPointParams = { campaign_id: string; meeting_point_id: string };

/** Take one's vote back while the window is open. */
export const useUnvoteMeetingPoint = (
  options?: UsePostOptions<MeetingPointDecisionResponse, UnvoteMeetingPointParams>,
) =>
  usePost({
    mutationFn: ({ campaign_id, meeting_point_id }: UnvoteMeetingPointParams) =>
      requestApi.delete<MeetingPointDecisionResponse>(`${base}/${campaign_id}/verification/${meeting_point_id}/vote`),
    queryKey: ['campaign-verification'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

export type DecideMeetingPointParams = {
  campaign_id: string;
  meeting_point_id: string;
  decision: 'verify' | 'reject';
  /** Required to reject… */
  reason?: string;
  /** …with the trash points that did not pass (at least one). */
  report_ids?: string[];
};

/** Admin: settles a flagged meeting point. */
export const useDecideMeetingPoint = (
  options?: UsePostOptions<MeetingPointDecisionResponse, DecideMeetingPointParams>,
) =>
  usePost({
    mutationFn: ({ campaign_id, meeting_point_id, ...body }: DecideMeetingPointParams) =>
      requestApi.put<MeetingPointDecisionResponse>(
        `${base}/${campaign_id}/verification/${meeting_point_id}/decision`,
        body,
      ),
    queryKey: ['completion-review'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
