import requestApi from '@/utils/requestApi';
import type { ICreateSOSRequest, ICreateSOSResponse } from '@/apis/sos/models/sos';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';

const url = '/api/v1/sos';

export const createSOS = async (data: ICreateSOSRequest): Promise<ICreateSOSResponse> => {
  return await requestApi.post<ICreateSOSResponse>(url, data);
};

export const useCreateSOS = (
  options?: UsePostOptions<ICreateSOSResponse, ICreateSOSRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createSOS,
    queryKey: ['sos'],
    messageSuccess: {
      content: t('SOS alert sent successfully'),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
