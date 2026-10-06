import requestApi from '@/utils/requestApi';
import type { IBaseResponse } from '@/types/BaseResponse';
import type { ICreateSosRequest, ISosDetailResponse } from '@/apis/sos/models/sos';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';
import { SOS_URL, toSosDetailResponse } from '@/apis/sos/adapters';

const url = SOS_URL;

export const createSos = async (data: ICreateSosRequest): Promise<ISosDetailResponse> => {
  return toSosDetailResponse(await requestApi.post<IBaseResponse>(url, data));
};

export const useCreateSos = (options?: UsePostOptions<ISosDetailResponse, ICreateSosRequest>) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createSos,
    queryKey: ['sos'],
    messageSuccess: { content: t('SOS alert sent successfully'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
