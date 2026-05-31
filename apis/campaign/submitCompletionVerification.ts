import requestApi from '@/utils/requestApi';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { IBaseResponse } from '@/types/BaseResponse';

export interface ISubmitCompletionVerificationRequest {
  campaignId: string;
  value: 1 | -1;
}

export interface ICompletionVerificationAction {
  campaign_id: string;
  value: number;
}

export const submitCompletionVerification = async (
  data: ISubmitCompletionVerificationRequest,
): Promise<
  IBaseResponse<{ completion_verification: ICompletionVerificationAction }>
> => {
  return await requestApi.post(
    `/api/v1/campaigns/${data.campaignId}/completion-verification`,
    { value: data.value },
  );
};

export const useSubmitCompletionVerification = (
  options?: UsePostOptions<
    IBaseResponse<{ completion_verification: ICompletionVerificationAction }>,
    ISubmitCompletionVerificationRequest
  >,
) => {
  return usePost({
    mutationFn: submitCompletionVerification,
    ...options,
  });
};
