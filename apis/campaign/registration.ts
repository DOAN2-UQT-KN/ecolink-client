import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type {
  ICloseShiftResponse,
  IGetCampaignRegistrationsResponse,
  IInviteNearbyResponse,
  IGetRegistrationOptionsResponse,
  IUpdateMyRegistrationsRequest,
  IUpdateMyRegistrationsResponse,
} from './models/registration';

const url = '/api/v1/campaigns';

export const getRegistrationOptions = async (
  campaignId: string,
): Promise<IGetRegistrationOptionsResponse> =>
  requestApi.get<IGetRegistrationOptionsResponse>(`${url}/${campaignId}/registration-options`);

/** Shifts the viewer can pick, with counts and overlaps. */
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

export const inviteNearby = async ({ campaign_id }: { campaign_id: string }): Promise<IInviteNearbyResponse> =>
  requestApi.post<IInviteNearbyResponse>(`${url}/${campaign_id}/invite-nearby`, {});

/** Managers: invite residents around the meeting points (once per 24 h). */
export const useInviteNearby = (
  options?: UsePostOptions<IInviteNearbyResponse, { campaign_id: string }>,
) =>
  usePost({
    mutationFn: inviteNearby,
    queryKey: ['campaign-registrations'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

export const closeShift = async ({
  campaign_id,
  shift_id,
}: {
  campaign_id: string;
  shift_id: string;
}): Promise<ICloseShiftResponse> =>
  requestApi.post<ICloseShiftResponse>(`${url}/${campaign_id}/shifts/${shift_id}/close`, {});

/** Managers: turn a shift off before it starts; its volunteers are told to pick another. */
export const useCloseShift = (
  options?: UsePostOptions<ICloseShiftResponse, { campaign_id: string; shift_id: string }>,
) =>
  usePost({
    mutationFn: closeShift,
    queryKey: ['campaign-registrations'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
