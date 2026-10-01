import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type {
  IGetCampaignRegistrationsResponse,
  IGetRegistrationOptionsResponse,
  IUpdateMyRegistrationsRequest,
  IUpdateMyRegistrationsResponse,
} from './models/registration';

const url = '/api/v1/campaigns';

export const getRegistrationOptions = async (
  campaignId: string,
): Promise<IGetRegistrationOptionsResponse> =>
  requestApi.get<IGetRegistrationOptionsResponse>(`${url}/${campaignId}/registration-options`);

/** Shifts the viewer can pick, with counts, overlaps and their absence record. */
export const useGetRegistrationOptions = (
  campaignId: string,
  options?: Omit<UseGetOptions<IGetRegistrationOptionsResponse>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['campaign-registration-options', campaignId],
    queryFn: () => getRegistrationOptions(campaignId),
    ...options,
  });

export const updateMyRegistrations = async ({
  campaign_id,
  ...body
}: IUpdateMyRegistrationsRequest): Promise<IUpdateMyRegistrationsResponse> =>
  requestApi.put<IUpdateMyRegistrationsResponse>(`${url}/${campaign_id}/registrations/me`, body);

/** Replaces the viewer's shifts in a campaign; [] leaves it. */
export const useUpdateMyRegistrations = (
  options?: UsePostOptions<IUpdateMyRegistrationsResponse, IUpdateMyRegistrationsRequest>,
) =>
  usePost({
    mutationFn: updateMyRegistrations,
    queryKey: ['campaign-registration-options'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

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
