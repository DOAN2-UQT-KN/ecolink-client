import requestApi from '@/utils/requestApi';
import type { IBaseResponse } from '@/types/BaseResponse';
import type { ISosDuplicatesRequest, ISosDuplicatesResponse } from '@/apis/sos/models/sos';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import { SOS_URL, toSosArrayResponse } from '@/apis/sos/adapters';

const url = `${SOS_URL}/duplicates`;

export const getSosDuplicates = async (
  params: ISosDuplicatesRequest,
): Promise<ISosDuplicatesResponse> => {
  return toSosArrayResponse(await requestApi.get<IBaseResponse>(url, params));
};

export const useSosDuplicates = (
  params: ISosDuplicatesRequest,
  options?: Omit<UseGetOptions<ISosDuplicatesResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['sos-duplicates', params],
    queryFn: () => getSosDuplicates(params),
    staleTime: 30_000,
    ...options,
  });
};
