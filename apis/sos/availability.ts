import requestApi from '@/utils/requestApi';
import type { IBaseResponse } from '@/types/BaseResponse';
import type {
  ISosAvailabilityResponse,
  IUpdateSosAvailabilityLocationRequest,
  IUpdateSosAvailabilityRequest,
} from '@/apis/sos/models/sos';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import { useTranslation } from 'react-i18next';
import { MessageType } from '@/utils/showMessage';
import { SOS_AVAILABILITY_URL } from '@/apis/sos/adapters';

const url = SOS_AVAILABILITY_URL;

export const getMyAvailability = async (): Promise<ISosAvailabilityResponse> => {
  return await requestApi.get<ISosAvailabilityResponse>(url);
};

export const updateAvailability = async (
  data: IUpdateSosAvailabilityRequest,
): Promise<ISosAvailabilityResponse> => {
  return await requestApi.put<ISosAvailabilityResponse>(url, data);
};

/** The server rounds the position (~500 m) and keeps only the latest one. */
export const updateAvailabilityLocation = async (
  data: IUpdateSosAvailabilityLocationRequest,
): Promise<IBaseResponse> => {
  return await requestApi.put<IBaseResponse>(`${url}/location`, data);
};

export const useMyAvailability = (
  options?: Omit<UseGetOptions<ISosAvailabilityResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['sos-availability'],
    queryFn: getMyAvailability,
    ...options,
  });
};

export const useUpdateAvailability = (
  options?: UsePostOptions<ISosAvailabilityResponse, IUpdateSosAvailabilityRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateAvailability,
    queryKey: ['sos-availability'],
    messageSuccess: { content: t('SOS availability saved'), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};

export const useUpdateAvailabilityLocation = (
  options?: UsePostOptions<IBaseResponse, IUpdateSosAvailabilityLocationRequest>,
) => {
  return usePost({
    mutationFn: updateAvailabilityLocation,
    queryKey: ['sos-availability'],
    silentError: true,
    ...options,
  });
};
