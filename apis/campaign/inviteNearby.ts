import requestApi from '@/utils/requestApi';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { IInviteNearbyResponse } from './models/registration';

const url = '/api/v1/campaigns';

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
