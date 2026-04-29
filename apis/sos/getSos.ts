import requestApi from '@/utils/requestApi';
import type { IGetSOSRequest, IGetSOSResponse } from '@/apis/sos/models/sos';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/sos';

export const getAllSOS = async (params: IGetSOSRequest): Promise<IGetSOSResponse> => {
  return await requestApi.get<IGetSOSResponse>(url, params);
};

export const useGetAllSOS = (
  params: IGetSOSRequest,
  options?: Omit<UseGetOptions<IGetSOSResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['sos', params],
    queryFn: () => getAllSOS(params),
    ...options,
  });
};
