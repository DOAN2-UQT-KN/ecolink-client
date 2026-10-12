import requestApi from '@/utils/requestApi';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { ISetShiftLeaderRequest, ISetShiftLeaderResponse } from './models/getCampaignManager';

const url = '/api/v1/campaigns';

export const setShiftLeader = async ({
  campaign_id,
  shift_id,
  ...body
}: ISetShiftLeaderRequest): Promise<ISetShiftLeaderResponse> =>
  requestApi.put<ISetShiftLeaderResponse>(`${url}/${campaign_id}/shifts/${shift_id}/leader`, body);

/** `usePost` invalidates `['campaign-managers']`; this also refreshes `['campaign']` (manager flags / ids). */
const useInvalidateCampaign = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['campaign'] });
};

/** Managers: choose who leads a shift that has not ended; only the team qualifies (spec 3.4). */
export const useSetShiftLeader = (
  options?: UsePostOptions<ISetShiftLeaderResponse, ISetShiftLeaderRequest>,
) => {
  const { t } = useTranslation();
  const invalidateCampaign = useInvalidateCampaign();
  const { onSuccess, ...rest } = options ?? {};
  return usePost({
    mutationFn: setShiftLeader,
    queryKey: ['campaign-managers'],
    messageSuccess: { content: t('Person in charge updated'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    onSuccess: (...args) => {
      void invalidateCampaign();
      return onSuccess?.(...args);
    },
    ...rest,
  });
};
