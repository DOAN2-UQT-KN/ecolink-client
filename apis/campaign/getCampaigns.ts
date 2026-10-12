import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import { IGetCampaignsRequest, IGetCampaignsResponse } from './models/getCampaigns';

const url = '/api/v1/campaigns';

export const getCampaigns = async (
  params: IGetCampaignsRequest,
): Promise<IGetCampaignsResponse> => {
  return await requestApi.get<IGetCampaignsResponse>(url, params);
};

export const useGetCampaigns = (
  params: IGetCampaignsRequest,
  options?: Omit<UseGetOptions<IGetCampaignsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['campaigns', params],
    queryFn: () => getCampaigns(params),
    ...options,
  });
};
