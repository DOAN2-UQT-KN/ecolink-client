import requestApi from '@/utils/requestApi';
import type { IGiftSourceBody, IGiftSourceResponse } from '@/apis/gift-source/models/giftSource';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';

const url = '/api/v1/admin/gift-sources';

export const createGiftSource = async (data: IGiftSourceBody): Promise<IGiftSourceResponse> => {
  return await requestApi.post<IGiftSourceResponse>(url, data);
};

export const useCreateGiftSource = (options?: UsePostOptions<IGiftSourceResponse, IGiftSourceBody>) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createGiftSource,
    queryKey: ['gift-sources'],
    messageSuccess: { content: t('Gift source created'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
