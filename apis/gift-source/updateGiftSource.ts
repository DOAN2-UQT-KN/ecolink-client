import requestApi from '@/utils/requestApi';
import type { IGiftSourceBody, IGiftSourceResponse } from '@/apis/gift-source/models/giftSource';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';

const url = '/api/v1/admin/gift-sources';

export const updateGiftSource = async ({
  id,
  data,
}: {
  id: string;
  data: IGiftSourceBody;
}): Promise<IGiftSourceResponse> => {
  return await requestApi.put<IGiftSourceResponse>(`${url}/${id}`, data);
};

export const useUpdateGiftSource = (
  options?: UsePostOptions<IGiftSourceResponse, { id: string; data: IGiftSourceBody }>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateGiftSource,
    queryKey: ['gift-sources'],
    messageSuccess: { content: t('Gift source updated'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
