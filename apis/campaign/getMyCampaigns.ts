import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import { IGetCampaignsRequest, IGetCampaignsResponse } from './models/getCampaigns';

const url = '/api/v1/campaigns';

export const getMyCampaigns = async (
  params: IGetCampaignsRequest,
): Promise<IGetCampaignsResponse> => {
  return await requestApi.get<IGetCampaignsResponse>(`${url}/my`, params);
};

export const useGetMyCampaigns = (
  params: IGetCampaignsRequest,
  options?: Omit<UseGetOptions<IGetCampaignsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['my-campaigns', params],
    queryFn: () => getMyCampaigns(params),
    ...options,
  });
};
