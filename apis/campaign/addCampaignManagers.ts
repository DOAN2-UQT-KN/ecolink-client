import requestApi from '@/utils/requestApi';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import { IAddCampaignManagersRequest, IAddCampaignManagersResponse } from './models/getCampaignManager';

const url = '/api/v1/campaigns';

export const addCampaignManagers = async (
  req: IAddCampaignManagersRequest,
): Promise<IAddCampaignManagersResponse> => {
  const { campaignId, ...body } = req;
  return await requestApi.post<IAddCampaignManagersResponse>(
    `${url}/${campaignId}/add-managers`,
    body,
  );
};

/** `usePost` invalidates `['campaign-managers']`; this also refreshes `['campaign']` (manager flags / ids). */
const useInvalidateCampaign = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['campaign'] });
};

export const useAddCampaignManagers = (
  options?: UsePostOptions<IAddCampaignManagersResponse, IAddCampaignManagersRequest>,
) => {
  const { t } = useTranslation();
  const invalidateCampaign = useInvalidateCampaign();
  const { onSuccess, ...rest } = options ?? {};
  return usePost({
    mutationFn: addCampaignManagers,
    queryKey: ['campaign-managers'],
    messageSuccess: { content: t('Manager added successfully'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    onSuccess: (...args) => {
      void invalidateCampaign();
      return onSuccess?.(...args);
    },
    ...rest,
  });
};
