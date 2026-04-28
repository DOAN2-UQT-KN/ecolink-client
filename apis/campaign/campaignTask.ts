import requestApi from '@/utils/requestApi';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';
import {
  IGetCampaignTaskRequest,
  IGetCampaignTaskResponse,
  ICreateCampaignTaskRequest,
  ICreateCampaignTaskResponse,
  IUpdateCampaignTaskRequest,
  IUpdateCampaignTaskResponse,
  IDeleteCampaignTaskRequest,
  IDeleteCampaignTaskResponse,
} from './models/campaignTask';

const baseUrl = (campaignId: string) => `/api/v1/campaigns/${campaignId}/tasks`;
const taskUrl = (taskId: string) => `/api/v1/campaigns/tasks/${taskId}`;

// --- Raw API functions ---

export const getCampaignTasks = async (
  params: IGetCampaignTaskRequest,
): Promise<IGetCampaignTaskResponse> => {
  return await requestApi.get<IGetCampaignTaskResponse>(baseUrl(params.campaignId));
};

export const createCampaignTask = async (
  req: ICreateCampaignTaskRequest & { campaignId: string },
): Promise<ICreateCampaignTaskResponse> => {
  const { campaignId, ...body } = req;
  return await requestApi.post<ICreateCampaignTaskResponse>(baseUrl(campaignId), body);
};

export const updateCampaignTask = async (
  req: IUpdateCampaignTaskRequest,
): Promise<IUpdateCampaignTaskResponse> => {
  const { id, ...body } = req;
  return await requestApi.put<IUpdateCampaignTaskResponse>(taskUrl(id), body);
};

export const deleteCampaignTask = async (
  req: IDeleteCampaignTaskRequest,
): Promise<IDeleteCampaignTaskResponse> => {
  return await requestApi.delete<IDeleteCampaignTaskResponse>(taskUrl(req.id), {}, { data: req });
};

// --- React Query hooks ---

export const useGetCampaignTasks = (
  params: IGetCampaignTaskRequest,
  options?: Omit<UseGetOptions<IGetCampaignTaskResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['campaign-tasks', params],
    queryFn: () => getCampaignTasks(params),
    ...options,
  });
};

export const useCreateCampaignTask = (
  options?: UsePostOptions<
    ICreateCampaignTaskResponse,
    ICreateCampaignTaskRequest & { campaignId: string }
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createCampaignTask,
    queryKey: ['campaign-tasks'],
    messageSuccess: {
      content: t('Task created successfully'),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

export const useUpdateCampaignTask = (
  options?: UsePostOptions<IUpdateCampaignTaskResponse, IUpdateCampaignTaskRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateCampaignTask,
    queryKey: ['campaign-tasks'],
    messageSuccess: {
      content: t('Task updated successfully'),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};

export const useDeleteCampaignTask = (
  options?: UsePostOptions<IDeleteCampaignTaskResponse, IDeleteCampaignTaskRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: deleteCampaignTask,
    queryKey: ['campaign-tasks'],
    messageSuccess: {
      content: t('Task deleted successfully'),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
