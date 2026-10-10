import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import type { IGetCampaignRegistrationsResponse } from './models/registration';

const url = '/api/v1/campaigns';

export const getCampaignRegistrations = async (
  campaignId: string,
): Promise<IGetCampaignRegistrationsResponse> =>
  requestApi.get<IGetCampaignRegistrationsResponse>(`${url}/${campaignId}/registrations`);

/** Managers: each shift with who registered. */
export const useGetCampaignRegistrations = (
  campaignId: string,
  options?: Omit<UseGetOptions<IGetCampaignRegistrationsResponse>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['campaign-registrations', campaignId],
    queryFn: () => getCampaignRegistrations(campaignId),
    ...options,
  });
