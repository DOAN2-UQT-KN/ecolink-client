import requestApi from '@/utils/requestApi';
import type { IBaseResponse } from '@/types/BaseResponse';
import type { ISosListRequest, ISosListResponse } from '@/apis/sos/models/sos';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import { SOS_URL, toSosListResponse } from '@/apis/sos/adapters';

const url = SOS_URL;

export const getSosList = async (params: ISosListRequest): Promise<ISosListResponse> => {
  return toSosListResponse(await requestApi.get<IBaseResponse>(url, params));
};

export const useSosList = (
  params: ISosListRequest,
  options?: Omit<UseGetOptions<ISosListResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['sos', params],
    queryFn: () => getSosList(params),
    ...options,
  });
};
