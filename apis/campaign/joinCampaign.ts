import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';
import {
  IJoinCampaignRequest,
  IJoinCampaignResponse,
  IGetJoinCampaignRequest,
  IGetJoinCampaignResponse,
  IGetMyJoinCampaignRequest,
  ICancelJoinCampaignRequest,
  ICancelJoinCampaignResponse,
  IProcessJoinCampaignResponse,
  IProcessJoinCampaignRequest,
} from './models/joinCampaign';

const baseUrl = '/api/v1/campaigns/volunteers/join-requests';
const myJoinRequestsUrl = '/api/v1/campaigns/volunteers/join-requests/my';

export const joinCampaign = async (req: IJoinCampaignRequest): Promise<IJoinCampaignResponse> => {
  return await requestApi.post<IJoinCampaignResponse>(baseUrl, req);
};

export const getJoinRequests = async (
  params: IGetJoinCampaignRequest,
): Promise<IGetJoinCampaignResponse> => {
  return await requestApi.get<IGetJoinCampaignResponse>(baseUrl, params);
};

export const getMyJoinRequests = async (
  params: IGetMyJoinCampaignRequest,
): Promise<IGetJoinCampaignResponse> => {
  return await requestApi.get<IGetJoinCampaignResponse>(myJoinRequestsUrl, params);
};

export const cancelJoinCampaign = async (
  req: ICancelJoinCampaignRequest,
): Promise<ICancelJoinCampaignResponse> => {
  return await requestApi.delete<ICancelJoinCampaignResponse>(`${baseUrl}/cancel`, {
    data: req,
  });
};

export const useJoinCampaign = (
  options?: UsePostOptions<IJoinCampaignResponse, IJoinCampaignRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: joinCampaign,
    queryKey: ['my-campaign-join-requests'],
    messageSuccess: {
      content: t('Join request sent successfully'),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

export const useGetJoinRequests = (
  params: IGetJoinCampaignRequest,
  options?: Omit<UseGetOptions<IGetJoinCampaignResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['campaign-join-requests', params],
    queryFn: () => getJoinRequests(params),
    ...options,
  });
};

export const useGetMyJoinRequests = (
  params: IGetMyJoinCampaignRequest,
  options?: Omit<UseGetOptions<IGetJoinCampaignResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['my-campaign-join-requests', params],
    queryFn: () => getMyJoinRequests(params),
    ...options,
  });
};

export const useCancelJoinCampaign = (
  options?: UsePostOptions<ICancelJoinCampaignResponse, ICancelJoinCampaignRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: cancelJoinCampaign,
    queryKey: ['my-campaign-join-requests'],
    messageSuccess: {
      content: t('Join request cancelled successfully'),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

export const processJoinCampaign = async (
  req: IProcessJoinCampaignRequest,
): Promise<IProcessJoinCampaignResponse> => {
  return await requestApi.put<IProcessJoinCampaignResponse>(`${baseUrl}/process`, req);
};

export const useProcessJoinCampaign = (
  options?: UsePostOptions<IProcessJoinCampaignResponse, IProcessJoinCampaignRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: processJoinCampaign,
    queryKey: ['my-campaign-join-requests'],
    messageSuccess: {
      content: t('Join request processed successfully'),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
