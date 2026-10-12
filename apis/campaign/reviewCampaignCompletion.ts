import { IBaseResponse } from '@/types/BaseResponse';
import requestApi from '@/utils/requestApi';
import { MessageType } from '@/utils/showMessage';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import type { ICompletionReviewRequest } from './models/processCampaign';

const url = '/api/v1/campaigns';

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
