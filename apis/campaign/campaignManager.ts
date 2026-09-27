import requestApi from '@/utils/requestApi';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import {
  IAddCampaignManagersRequest,
  IAddCampaignManagersResponse,
  IGetCampaignManagerRequest,
  IGetCampaignManagerResponse,
  IRemoveCampaignManagerRequest,
  IRemoveCampaignManagerResponse,
} from './models/getCampaignManager';

const url = '/api/v1/campaigns';

export const getCampaignManager = async (
  params: IGetCampaignManagerRequest,
): Promise<IGetCampaignManagerResponse> => {
  const { campaignId, ...rest } = params;
  return await requestApi.get<IGetCampaignManagerResponse>(`${url}/${campaignId}/managers`, rest);
};

export const addCampaignManagers = async (
  req: IAddCampaignManagersRequest,
): Promise<IAddCampaignManagersResponse> => {
  const { campaignId, ...body } = req;
  return await requestApi.post<IAddCampaignManagersResponse>(
    `${url}/${campaignId}/add-managers`,
    body,
  );
};

export const removeCampaignManager = async (
  req: IRemoveCampaignManagerRequest,
): Promise<IRemoveCampaignManagerResponse> => {
  const { campaignId, ...body } = req;
  return await requestApi.post<IRemoveCampaignManagerResponse>(
    `${url}/${campaignId}/remove-manager`,
    body,
  );
};

export const useGetCampaignManager = (
  params: IGetCampaignManagerRequest,
  options?: Omit<UseGetOptions<IGetCampaignManagerResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['campaign-managers', params],
    queryFn: () => getCampaignManager(params),
    ...options,
  });
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
