import { IBaseResponse } from '@/types/BaseResponse';
import requestApi from '@/utils/requestApi';
import { MessageType } from '@/utils/showMessage';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import type { IShiftOverview } from './shiftResult';

const url = '/api/v1/campaigns';

/** Spec 5.2: no partial approval; reject reopens shifts (at most 3 times), cancel ends it. */
export type CompletionDecision = 'approve' | 'reject' | 'cancel';

export type ICompletionReviewRequest = {
  id: string;
  decision: CompletionDecision;
  /** Required to reject or cancel. */
  reject_reason?: string;
  /** Approve: the settled difficulty (points follow it). */
  difficulty?: number;
  /** Reject: shifts with a result to complete again; at least one. */
  shift_ids?: string[];
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
  can_reject: boolean;
  /** The saved submission; `preview` = built live from the shifts' results before marking done. */
  submission: {
    preview: boolean;
    reports: ICompletionReviewReport[];
    counts: { cleaned: number; partial: number; unhandled: number };
  };
  totals: IShiftOverview['totals'];
  shifts: ICompletionReviewShift[];
  verification: {
    clean_count: number;
    not_clean_count: number;
    flagged: boolean;
    flag_ratio: number;
    flag_min_votes: number;
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
