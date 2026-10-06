import requestApi from '@/utils/requestApi';
import type { IBaseResponse } from '@/types/BaseResponse';
import type { ISosDetailResponse, ISosLocationRequest } from '@/apis/sos/models/sos';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';
import { SOS_URL, toSosDetailResponse } from '@/apis/sos/adapters';

const url = SOS_URL;

/** POST /sos/:id/respond — "I'm coming to help now". */
export const respondSos = async (id: number): Promise<ISosDetailResponse> => {
  return toSosDetailResponse(await requestApi.post<IBaseResponse>(`${url}/${id}/respond`, {}));
};

/** DELETE /sos/:id/respond — "I can't come anymore". */
export const cancelRespondSos = async (id: number): Promise<ISosDetailResponse> => {
  return toSosDetailResponse(await requestApi.delete<IBaseResponse>(`${url}/${id}/respond`));
};

/** PUT /sos/:id/respond/location — sent every 30 s while on the way. */
export const updateResponderLocation = async ({
  id,
  ...data
}: ISosLocationRequest): Promise<ISosDetailResponse> => {
  return toSosDetailResponse(
    await requestApi.put<IBaseResponse>(`${url}/${id}/respond/location`, data),
  );
};

export const useRespondSos = (options?: UsePostOptions<ISosDetailResponse, number>) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: respondSos,
    queryKey: ['sos'],
    messageSuccess: { content: t('Thank you! The team knows you are on the way'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const useCancelRespond = (options?: UsePostOptions<ISosDetailResponse, number>) => {
  return usePost({
    mutationFn: cancelRespondSos,
    queryKey: ['sos'],
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const useUpdateResponderLocation = (
  options?: UsePostOptions<ISosDetailResponse, ISosLocationRequest>,
) => {
  return usePost({
    mutationFn: updateResponderLocation,
    silentError: true,
    ...options,
  });
};
