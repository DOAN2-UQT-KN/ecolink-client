import { IBaseResponse } from '@/types/BaseResponse';
import requestApi from '@/utils/requestApi';
import { MessageType } from '@/utils/showMessage';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';

const url = '/api/v1/campaigns';

export type ICompletionReviewRequest = {
  id: string;
  decision: 'approve' | 'reject';
  reject_reason?: string;
};

export const reviewCampaignCompletion = async (
  params: ICompletionReviewRequest,
): Promise<IBaseResponse<unknown>> => {
  const { id, decision, reject_reason } = params;
  return await requestApi.put<IBaseResponse<unknown>>(
    `${url}/${id}/completion-review`,
    {
      decision,
      rejectReason: reject_reason,
    },
  );
};

export const useReviewCampaignCompletion = (
  options?: UsePostOptions<IBaseResponse<unknown>, ICompletionReviewRequest>,
) => {
  return usePost({
    mutationFn: reviewCampaignCompletion,
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
