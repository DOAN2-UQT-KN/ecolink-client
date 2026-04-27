import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import {
  IGetCampaignManagerRequest,
  IGetCampaignManagerResponse,
} from './models/getCampaignManager';

const url = '/api/v1/campaigns';

export const getCampaignManager = async (
  params: IGetCampaignManagerRequest,
): Promise<IGetCampaignManagerResponse> => {
  const { campaignId, ...rest } = params;
  return await requestApi.get<IGetCampaignManagerResponse>(`${url}/${campaignId}/managers`, rest);
};

export const useGetCampaignManager = (
  params: IGetCampaignManagerRequest,
  options?: Omit<UseGetOptions<IGetCampaignManagerResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['campaign-managers', params],
    queryFn: () => getCampaignManager(params),
    ...options,
  });
};
