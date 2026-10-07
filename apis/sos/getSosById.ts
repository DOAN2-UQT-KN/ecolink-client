import requestApi from '@/utils/requestApi';
import type { IBaseResponse } from '@/types/BaseResponse';
import type { ISosDetailResponse } from '@/apis/sos/models/sos';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';
import { SOS_URL, toSosDetailResponse } from '@/apis/sos/adapters';
import { isSosOpen } from '@/constants/sos';

const url = SOS_URL;

export const getSosById = async (id: number): Promise<ISosDetailResponse> => {
  return toSosDetailResponse(await requestApi.get<IBaseResponse>(`${url}/${id}`));
};

/** Polls every 5 s while the SOS is still open (no realtime channel). */
export const useSos = (
  id: number,
  options?: Omit<UseGetOptions<ISosDetailResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['sos-detail', id],
    queryFn: () => getSosById(id),
    staleTime: 0,
    refetchInterval: (query) => {
      const state = query.state.data?.data?.state;
      return !state || isSosOpen(state) ? 5_000 : false;
    },
    ...options,
  });
};
