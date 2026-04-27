import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import {
  IGetCampaignVolunteerRequest,
  IGetCampaignVolunteerResponse,
} from './models/getCampaignVolunteer';

const url = '/api/v1/campaigns/volunteers/approved';

export const getCampaignVolunteer = async (
  params: IGetCampaignVolunteerRequest,
): Promise<IGetCampaignVolunteerResponse> => {
  return await requestApi.get<IGetCampaignVolunteerResponse>(url, params);
};

export const useGetCampaignVolunteer = (
  params: IGetCampaignVolunteerRequest,
  options?: Omit<UseGetOptions<IGetCampaignVolunteerResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['campaign-volunteers', params],
    queryFn: () => getCampaignVolunteer(params),
    ...options,
  });
};
