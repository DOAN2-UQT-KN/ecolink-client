import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import { IGetCampaignsRequest, IGetCampaignsResponse } from './models/getCampaigns';

const url = '/api/v1/campaigns';
const myCampaignsUrl = '/api/v1/campaigns/my';
const allCampaignsUrl = '/api/v1/campaigns/all';

export const getCampaigns = async (
  params: IGetCampaignsRequest,
): Promise<IGetCampaignsResponse> => {
  return await requestApi.get<IGetCampaignsResponse>(url, params);
};

export const getMyCampaigns = async (
  params: IGetCampaignsRequest,
): Promise<IGetCampaignsResponse> => {
  return await requestApi.get<IGetCampaignsResponse>(myCampaignsUrl, params);
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

export const getAllCampaigns = async (params: any): Promise<IGetCampaignsResponse> => {
  return await requestApi.get<IGetCampaignsResponse>(allCampaignsUrl, params);
};

export const useGetAllCampaigns = (
  params: any,
  options?: Omit<UseGetOptions<IGetCampaignsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['all-campaigns', params],
    queryFn: () => getAllCampaigns(params),
    ...options,
  });
};
