import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import type { ICampaignVerification } from './models/verification';

const url = '/api/v1/campaigns';

export const getCampaignVerification = (campaignId: string): Promise<IBaseResponse<ICampaignVerification>> =>
  requestApi.get<IBaseResponse<ICampaignVerification>>(`${url}/${campaignId}/verification`);

export const useCampaignVerification = (
  campaignId: string,
  options?: Omit<UseGetOptions<IBaseResponse<ICampaignVerification>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['campaign-verification', campaignId],
    queryFn: () => getCampaignVerification(campaignId),
    ...options,
  });
