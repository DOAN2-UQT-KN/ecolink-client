import { IBaseResponse } from '@/types/BaseResponse';
import requestApi from '@/utils/requestApi';
import { MessageType } from '@/utils/showMessage';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import type { ILayer1, IShiftOverview } from './shiftResult';
import type { AwaitingAdminReason, IMeetingPointView } from './verification';

const url = '/api/v1/campaigns';

/**
 * Result verification decides the campaign; the admin only cancels it, or approves it once
 * verification hands it over (`awaiting_admin`). Flagged meeting points are decided one by one.
 */
export type CompletionDecision = 'approve' | 'cancel';

export type ICompletionReviewRequest = {
  id: string;
  decision: CompletionDecision;
  /** Required to cancel. */
  reject_reason?: string;
  /** Approve: the settled difficulty (points follow it). */
  difficulty?: number;
};

export const reviewCampaignCompletion = async (
  params: ICompletionReviewRequest,
): Promise<IBaseResponse<unknown>> => {
  const { id, ...body } = params;
  return await requestApi.put<IBaseResponse<unknown>>(`${url}/${id}/completion-review`, body);
};

export const useReviewCampaignCompletion = (
  options?: UsePostOptions<IBaseResponse<unknown>, ICompletionReviewRequest>,
) => {
  return usePost({
    mutationFn: reviewCampaignCompletion,
    queryKey: ['completion-review'],
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

export type CompletionReportStatus = 'cleaned' | 'partial' | 'unhandled';

export interface ICompletionReviewReport {
  report_id: string;
  status: CompletionReportStatus;
  /** Why no shift handled it (manager). */
  reason: string | null;
  before_urls: string[];
  after_urls: string[];
  /** Layer 1 from the photos; null for a point no shift handled. */
  layer1: ILayer1 | null;
  meeting_point_id: string | null;
  report: {
    title: string | null;
    detail_address: string | null;
    latitude: number | null;
    longitude: number | null;
    severity_level: number | null;
    waste_type: string | null;
  } | null;
}

export interface ICompletionReviewShift {
  shift_id: string;
  meeting_point_id: string;
  meeting_point_name: string;
  start_at: string;
  end_at: string;
  has_result: boolean;
  reopened_at: string | null;
  reopen_reason: string | null;
}

/** GET /campaigns/:id/completion-review (admin or campaign manager). */
export interface ICompletionReview {
  campaign_id: string;
  status: number;
  difficulty: number;
  difficulty_range: { min: number; max: number };
  reject_reason: string | null;
  completion_submitted_at: string | null;
  rejection_count: number;
  max_rejections: number;
  /** Result verification handed the campaign to the admin: approve or cancel. */
  awaiting_admin: boolean;
  awaiting_admin_reason: AwaitingAdminReason | null;
  /** Approve is possible now. */
  can_approve: boolean;
  /** The saved submission; `preview` = built live from the shifts' results before marking done. */
  submission: {
    preview: boolean;
    reports: ICompletionReviewReport[];
    counts: { cleaned: number; partial: number; unhandled: number };
  };
  totals: IShiftOverview['totals'];
  shifts: ICompletionReviewShift[];
  /** Each meeting point under result verification (latest round), with every vote. */
  verification: {
    meeting_points: IMeetingPointView[];
  };
}

export const useCompletionReview = (
  campaignId: string,
  options?: Omit<UseGetOptions<IBaseResponse<ICompletionReview>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['completion-review', campaignId],
    queryFn: () => requestApi.get<IBaseResponse<ICompletionReview>>(`${url}/${campaignId}/completion-review`),
    ...options,
  });
