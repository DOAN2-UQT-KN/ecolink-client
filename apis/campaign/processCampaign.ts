import { IBaseResponse } from '@/types/BaseResponse';
import requestApi from '@/utils/requestApi';
import { MessageType } from '@/utils/showMessage';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';

const url = '/api/v1/campaigns';

export type IVerifyCampaignRequest = {
  id: string;
  status?: number;
  reject_reason?: string | null;
};

export type ICompletionReviewRequest = {
  id: string;
  decision: 'approve' | 'reject';
  reject_reason?: string;
};

export const verifyCampaign = async (
  params: IVerifyCampaignRequest,
): Promise<IBaseResponse<unknown>> => {
  const { id, ...rest } = params;
  return await requestApi.put<IBaseResponse<unknown>>(`${url}/${id}/verify`, {
    ...rest,
  });
};

export const useVerifyCampaign = (
  options?: UsePostOptions<IBaseResponse<unknown>, IVerifyCampaignRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: verifyCampaign,
    messageSuccess: {
      content: t('Campaign verified successfully'),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
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
