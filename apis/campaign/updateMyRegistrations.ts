import requestApi from '@/utils/requestApi';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type {
  IUpdateMyRegistrationsRequest,
  IUpdateMyRegistrationsResponse,
} from './models/registration';

const url = '/api/v1/campaigns';

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
