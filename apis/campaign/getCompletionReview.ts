import { IBaseResponse } from '@/types/BaseResponse';
import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import type { ICompletionReview } from './models/processCampaign';

const url = '/api/v1/campaigns';

export const getCompletionReview = (campaignId: string): Promise<IBaseResponse<ICompletionReview>> =>
  requestApi.get<IBaseResponse<ICompletionReview>>(`${url}/${campaignId}/completion-review`);

export const useCompletionReview = (
  campaignId: string,
  options?: Omit<UseGetOptions<IBaseResponse<ICompletionReview>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['completion-review', campaignId],
    queryFn: () => getCompletionReview(campaignId),
    ...options,
  });
