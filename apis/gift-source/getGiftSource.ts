import requestApi from '@/utils/requestApi';
import type { IGiftSourceResponse } from '@/apis/gift-source/models/giftSource';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/admin/gift-sources';

export const getGiftSource = async (id: string): Promise<IGiftSourceResponse> => {
  return await requestApi.get<IGiftSourceResponse>(`${url}/${id}`);
};

export const useGetGiftSource = (
  id: string,
  options?: Omit<UseGetOptions<IGiftSourceResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-sources', 'detail', id],
    queryFn: () => getGiftSource(id),
    enabled: Boolean(id),
    ...options,
  });
};
