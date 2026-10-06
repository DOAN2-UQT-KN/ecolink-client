import requestApi from '@/utils/requestApi';
import type { IBaseResponse } from '@/types/BaseResponse';
import type {
  IResolveSosRequest,
  ISosDetailResponse,
  ISosLocationRequest,
} from '@/apis/sos/models/sos';
import { usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';
import { SOS_URL, toSosDetailResponse } from '@/apis/sos/adapters';

const url = SOS_URL;

/** PUT /sos/:id/location — the reporter moves the SOS. */
export const updateSosLocation = async ({
  id,
  ...data
}: ISosLocationRequest): Promise<ISosDetailResponse> => {
  return toSosDetailResponse(await requestApi.put<IBaseResponse>(`${url}/${id}/location`, data));
};

/** PUT /sos/:id/resolve */
export const resolveSos = async ({ id, ...data }: IResolveSosRequest): Promise<ISosDetailResponse> => {
  return toSosDetailResponse(await requestApi.put<IBaseResponse>(`${url}/${id}/resolve`, data));
};

export const useUpdateSosLocation = (
  options?: UsePostOptions<ISosDetailResponse, ISosLocationRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateSosLocation,
    queryKey: ['sos'],
    messageSuccess: { content: t('SOS location updated'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const useResolveSos = (options?: UsePostOptions<ISosDetailResponse, IResolveSosRequest>) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: resolveSos,
    queryKey: ['sos'],
    messageSuccess: { content: t('SOS marked as resolved'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
