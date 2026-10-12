import requestApi from '@/utils/requestApi';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import { IRemoveCampaignManagerRequest, IRemoveCampaignManagerResponse } from './models/getCampaignManager';

const url = '/api/v1/campaigns';

export const removeCampaignManager = async (
  req: IRemoveCampaignManagerRequest,
): Promise<IRemoveCampaignManagerResponse> => {
  const { campaignId, ...body } = req;
  return await requestApi.post<IRemoveCampaignManagerResponse>(
    `${url}/${campaignId}/remove-manager`,
    body,
  );
};

/** `usePost` invalidates `['campaign-managers']`; this also refreshes `['campaign']` (manager flags / ids). */
const useInvalidateCampaign = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['campaign'] });
};

export const useRemoveCampaignManager = (
  options?: UsePostOptions<IRemoveCampaignManagerResponse, IRemoveCampaignManagerRequest>,
) => {
  const { t } = useTranslation();
  const invalidateCampaign = useInvalidateCampaign();
  const { onSuccess, ...rest } = options ?? {};
  return usePost({
    mutationFn: removeCampaignManager,
    queryKey: ['campaign-managers'],
    messageSuccess: { content: t('Manager removed successfully'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    onSuccess: (...args) => {
      void invalidateCampaign();
      return onSuccess?.(...args);
    },
    ...rest,
  });
};
