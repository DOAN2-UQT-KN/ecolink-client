import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import { IGetCampaignsRequest, IGetCampaignsResponse } from './models/getCampaigns';

const url = '/api/v1/campaigns';

export const getAllCampaigns = async (params: IGetCampaignsRequest): Promise<IGetCampaignsResponse> => {
  return await requestApi.get<IGetCampaignsResponse>(`${url}/all`, params);
};

export const useGetAllCampaigns = (
  params: IGetCampaignsRequest,
  options?: Omit<UseGetOptions<IGetCampaignsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['all-campaigns', params],
    queryFn: () => getAllCampaigns(params),
    ...options,
  });
};
